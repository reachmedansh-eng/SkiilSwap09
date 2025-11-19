export function Footer() {
  return (
    <footer className="bg-white border-t-4 border-primary/30 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-primary">🎮 SkillSwap</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Learn together, grow together. Exchange skills with a global community.
            </p>
          </div>
          
          {/* Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li><a href="/courses" className="hover:text-primary transition-colors">📚 Courses</a></li>
              <li><a href="/listings" className="hover:text-primary transition-colors">🔍 Listings</a></li>
              <li><a href="/exchanges" className="hover:text-primary transition-colors">🔄 Exchanges</a></li>
              <li><a href="/support" className="hover:text-primary transition-colors">💬 Support</a></li>
            </ul>
          </div>
          
          {/* Social */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Connect</h4>
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-primary/10 border-2 border-primary/30 rounded-sm pixel-corners flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                <span className="text-lg">💬</span>
              </div>
              <div className="w-10 h-10 bg-primary/10 border-2 border-primary/30 rounded-sm pixel-corners flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                <span className="text-lg">🐦</span>
              </div>
              <div className="w-10 h-10 bg-primary/10 border-2 border-primary/30 rounded-sm pixel-corners flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                <span className="text-lg">📘</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-700 dark:text-gray-300">
          <p>© 2025 SkillSwap. All rights reserved.</p>
          <p className="flex items-center gap-2">
            Made with <span className="text-destructive animate-pulse">❤️</span> by the community
          </p>
        </div>
      </div>
    </footer>
  );
}