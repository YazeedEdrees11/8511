export default function Footer() {
  return (
    <footer className="border-t border-line/20 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-4 justify-between text-sm text-muted">
        <span>© {new Date().getFullYear()} Eighty Five Eleven · Swefieh Village, Amman</span>
        <a href="mailto:EightyFiveEleven.8511@gmail.com" className="hover:text-ink">EightyFiveEleven.8511@gmail.com</a>
      </div>
    </footer>
  );
}
