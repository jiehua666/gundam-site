import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl font-bold text-primary neon-glow">GUNDAM</span>
              <span className="text-xl font-bold text-foreground">SITE</span>
            </div>
            <p className="text-muted-foreground text-sm">
              机体百科 + 创作者社区
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              为高达爱好者打造的交流平台
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-foreground font-medium mb-4">快速链接</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/mechas" className="text-muted-foreground hover:text-primary transition">
                  机体库
                </Link>
              </li>
              <li>
                <Link href="/creations" className="text-muted-foreground hover:text-primary transition">
                  作品
                </Link>
              </li>
              <li>
                <Link href="/rankings" className="text-muted-foreground hover:text-primary transition">
                  排行
                </Link>
              </li>
              <li>
                <Link href="/activities" className="text-muted-foreground hover:text-primary transition">
                  活动
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-foreground font-medium mb-4">支持</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition">
                  关于我们
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-muted-foreground hover:text-primary transition">
                  帮助中心
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary transition">
                  隐私政策
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-primary transition">
                  服务条款
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-center text-muted-foreground text-sm">
            © 2026 GUNDAM SITE. Built with Next.js
          </p>
        </div>
      </div>
    </footer>
  );
}
