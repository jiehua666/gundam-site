"use client";

import { useState, useEffect } from "react";
import { Grid3X3, Layers, Star, Lock } from "lucide-react";

interface Card {
  id: string;
  name: string;
  rarity: string;
  series: string | null;
  imageUrl: string | null;
  description: string | null;
}

interface UserCard {
  id: string;
  cardId: string;
  count: number;
  obtainedAt: string;
  card: Card;
}

interface CardCollectionProps {
  currentUserId?: string;
}

export default function CardCollection({ currentUserId: propUserId }: CardCollectionProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [stats, setStats] = useState<{
    totalCards: number;
    totalCount: number;
    byRarity: Record<string, number>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"collection" | "all">("collection");

  useEffect(() => {
    if (propUserId) {
      setCurrentUserId(propUserId);
    } else {
      const userData = localStorage.getItem('auth_user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setCurrentUserId(user.id || null);
        } catch (e) {
          // ignore
        }
      }
    }
  }, [propUserId]);

  useEffect(() => {
    if (currentUserId) {
      fetchData();
    }
  }, [currentUserId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [userCardsRes, allCardsRes] = await Promise.all([
        fetch('/api/user-cards'),
        fetch('/api/cards'),
      ]);

      if (userCardsRes.ok) {
        const userData = await userCardsRes.json();
        setUserCards(userData.userCards || []);
        setStats(userData.stats);
      }

      if (allCardsRes.ok) {
        const cardsData = await allCardsRes.json();
        setAllCards(cardsData.cards || []);
      }
    } catch (error) {
      console.error("Failed to fetch card data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
      case 'rare':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'epic':
        return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
      case 'legendary':
        return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const getRarityName = (rarity: string) => {
    switch (rarity) {
      case 'common': return '普通';
      case 'rare': return '稀有';
      case 'epic': return '史诗';
      case 'legendary': return '传说';
      default: return rarity;
    }
  };

  const userCardIds = new Set(userCards.map(uc => uc.cardId));

  const displayCards = activeTab === "collection"
    ? userCards
    : allCards.map(card => {
        const userCard = userCards.find(uc => uc.cardId === card.id);
        return userCard ? { ...userCard, card } : null;
      }).filter(Boolean) as UserCard[];

  if (isLoading) {
    return (
      <div className="glass-card neon-border rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-primary/20 rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-primary/10 rounded"></div>
      </div>
    );
  }

  return (
    <div className="glass-card neon-border rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg text-foreground">卡牌收藏</h3>
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Layers className="w-4 h-4" />
              <span>{stats.totalCards} 种</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Star className="w-4 h-4" />
              <span>{stats.totalCount} 张</span>
            </div>
          </div>
        )}
      </div>

      {/* Rarity Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs">
        {['common', 'rare', 'epic', 'legendary'].map((rarity) => (
          <div key={rarity} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${getRarityColor(rarity).split(' ')[1]}`} />
            <span className="text-muted-foreground">{getRarityName(rarity)}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-border">
        <button
          onClick={() => setActiveTab("collection")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "collection"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          我的收藏 ({userCards.length})
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "all"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          全部卡牌 ({allCards.length})
        </button>
      </div>

      {/* Cards Grid */}
      {displayCards.length === 0 ? (
        <div className="text-center py-12">
          <Grid3X3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            {activeTab === "collection" ? "暂无收藏" : "暂无卡牌"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {displayCards.map((userCard) => (
            <div
              key={userCard.id}
              className={`relative rounded-lg p-3 border transition-all hover:scale-105 ${getRarityColor(userCard.card.rarity)}`}
            >
              {/* Card Image/Icon */}
              <div className="aspect-square bg-black/30 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                {userCard.card.imageUrl ? (
                  <img
                    src={userCard.card.imageUrl}
                    alt={userCard.card.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Grid3X3 className="w-8 h-8 text-current opacity-50" />
                )}
              </div>

              {/* Card Name */}
              <p className="text-xs font-medium text-center truncate">
                {userCard.card.name}
              </p>

              {/* Count Badge */}
              {userCard.count > 1 && (
                <div className="absolute top-1 right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {userCard.count}
                </div>
              )}

              {/* Locked indicator for "all" tab */}
              {activeTab === "all" && !userCardIds.has(userCard.cardId) && (
                <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                  <Lock className="w-6 h-6 text-gray-500" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Progress */}
      {stats && stats.totalCards > 0 && allCards.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>收集进度</span>
            <span>{stats.totalCards} / {allCards.length}</span>
          </div>
          <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(stats.totalCards / allCards.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
