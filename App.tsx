import React, { useState, useMemo } from 'react';
import { Sparkles, ArrowRight, MapPin, Store, ChevronLeft, ChevronRight, Globe, Play, Share2 } from 'lucide-react';
import { Book, CartItem, Review } from './types';
import { BOOKS, MOCK_REVIEWS } from './booksData';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import BookCard from './components/BookCard';
import BookListItem from './components/BookListItem';
import CartDrawer from './components/CartDrawer';
import BookDetailModal from './components/BookDetailModal';

export default function App() {
  // Localization state
  const [lang, setLang] = useState<'KO' | 'EN'>('KO');

  // Nav, filter search and listing states
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'favorites'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceFilter, setPriceFilter] = useState<string[]>([]);
  const [pubDateFilter, setPubDateFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<'popular' | 'newest' | 'price'>('popular');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Cart & favorities interaction states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Modals focus state
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  // Custom Reviews submitted during mock sessions
  const [customReviews, setCustomReviews] = useState<{ [bookId: string]: Review[] }>({});

  // Reset page when category, filters or search changes
  const resetNavigationFilter = () => {
    setCurrentPage(1);
  };

  // Callback search triggers
  const handleSearch = (query: string) => {
    setActiveSearch(query);
    resetNavigationFilter();
    setActiveTab('search');
  };

  // Cart quantity adjusters
  const handleAddToCart = (bookId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.bookId === bookId);
      if (existing) {
        return prev.map(item => item.bookId === bookId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { bookId, quantity: 1 }];
    });
    // Visual success indicator
    alert(lang === 'KO' ? '장바구니에 담겼습니다!' : 'Added to cart successfully!');
  };

  const handleUpdateQuantity = (bookId: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveCartItem(bookId);
      return;
    }
    setCart(prev => prev.map(item => item.bookId === bookId ? { ...item, quantity: qty } : item));
  };

  const handleRemoveCartItem = (bookId: string) => {
    setCart(prev => prev.filter(item => item.bookId !== bookId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Favoriting mechanisms
  const handleToggleFavorite = (bookId: string) => {
    setFavorites(prev => {
      const isFav = prev.includes(bookId);
      if (isFav) {
        alert(lang === 'KO' ? '찜 해제되었습니다.' : 'Removed from Wishlist.');
        return prev.filter(id => id !== bookId);
      } else {
        alert(lang === 'KO' ? '찜 목록에 추가되었습니다!' : 'Added to Wishlist!');
        return [...prev, bookId];
      }
    });
  };

  // Review publish callback
  const handleAddReview = (bookId: string, rating: number, comment: string, reviewer: string) => {
    const formattedDate = new Date().toISOString().split('T')[0];
    const newRev: Review = {
      id: `custom-rev-${Date.now()}`,
      user: reviewer,
      rating,
      comment,
      commentEn: comment,
      date: formattedDate
    };

    setCustomReviews(prev => {
      const existing = prev[bookId] || [];
      return {
        ...prev,
        [bookId]: [newRev, ...existing]
      };
    });
  };

  // Combine default static and custom newly-added comments
  const getReviewsForBook = (bookId: string): Review[] => {
    const addedReviews = customReviews[bookId] || [];
    return [...addedReviews, ...MOCK_REVIEWS];
  };

  // Compute final filtered results for Search/Explorer page
  const filteredBooks = useMemo(() => {
    return BOOKS.filter(book => {
      // Category filter check
      if (selectedCategory && book.category !== selectedCategory) {
        return false;
      }

      // Search match query check
      if (activeSearch.trim()) {
        const query = activeSearch.toLowerCase();
        const titleMatch = book.title.toLowerCase().includes(query) || (book.titleEn || '').toLowerCase().includes(query);
        const writerMatch = book.author.toLowerCase().includes(query) || book.authorEn.toLowerCase().includes(query);
        const descMatch = book.desc.toLowerCase().includes(query) || book.descEn.toLowerCase().includes(query);
        const publisherMatch = book.publisher.toLowerCase().includes(query);
        
        if (!titleMatch && !writerMatch && !descMatch && !publisherMatch) {
          return false;
        }
      }

      // Price filter index evaluation
      if (priceFilter.length > 0) {
        let matchesPrice = false;
        if (priceFilter.includes('under-10k') && book.price <= 10000) matchesPrice = true;
        if (priceFilter.includes('10k-20k') && book.price > 10000 && book.price <= 20000) matchesPrice = true;
        if (priceFilter.includes('over-20k') && book.price > 20000) matchesPrice = true;
        
        if (!matchesPrice) return false;
      }

      // Publication date index calculation
      if (pubDateFilter !== 'all') {
        const dateLimit = new Date('2026-06-08'); // Based on simulated date
        if (pubDateFilter === '1m') {
          dateLimit.setMonth(dateLimit.getMonth() - 1);
        } else if (pubDateFilter === '6m') {
          dateLimit.setMonth(dateLimit.getMonth() - 6);
        } else if (pubDateFilter === '1y') {
          dateLimit.setFullYear(dateLimit.getFullYear() - 1);
        }
        const bookDate = new Date(book.pubDate);
        if (bookDate < dateLimit) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sorters priority sequence mapping
      if (sortOption === 'popular') {
        return b.rating - a.rating; // best rating first
      }
      if (sortOption === 'newest') {
        return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
      }
      if (sortOption === 'price') {
        return a.price - b.price; // cheap price first
      }
      return 0;
    });
  }, [activeSearch, selectedCategory, priceFilter, pubDateFilter, sortOption]);

  // Compute favorited records
  const favoritedBooksList = useMemo(() => {
    return BOOKS.filter(book => favorites.includes(book.id));
  }, [favorites]);

  // Curated Best Sellers (Always displays the first 5 core books pictured in Screenshot 1)
  const bestsellerBooks = useMemo(() => {
    return BOOKS.slice(0, 5);
  }, []);

  // Editor's Choice Featured Book
  const editorsChoiceBook = useMemo(() => {
    return BOOKS.find(b => b.id === '생각의지도') || BOOKS[0];
  }, []);

  // Direct mock Buy Now click handler
  const handleBuyNow = (book: Book) => {
    // Add to cart first
    setCart(prev => {
      const existing = prev.find(item => item.bookId === book.id);
      if (existing) {
        return prev.map(item => item.bookId === book.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { bookId: book.id, quantity: 1 }];
    });
    // Open cart automatically (smooth e-commerce slide)
    setIsCartOpen(true);
  };

  // Direct checkout handler for Hero click
  const handleCheckNow = () => {
    // Select "소년이 온다" as featured book
    const target = BOOKS.find(b => b.id === '소년이온다');
    if (target) {
      setSelectedBook(target);
    }
  };

  return (
    <div className="bg-[#fcf9f8] text-[#1c1b1b] min-h-screen flex flex-col font-sans select-none antialiased">
      
      {/* Top sticky navigation layout */}
      <Header 
        lang={lang} 
        setLang={setLang}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
        cart={cart}
        openCart={() => setIsCartOpen(true)}
        onNavigate={(tab) => { setActiveTab(tab); resetNavigationFilter(); }}
        activeCategory={selectedCategory}
        setActiveCategory={(cat) => { setSelectedCategory(cat); resetNavigationFilter(); }}
      />

      <div className="max-w-[1240px] w-full mx-auto flex flex-grow relative">
        
        {/* Category filters left-sidebar menu */}
        <Sidebar 
          lang={lang} 
          selectedCategory={selectedCategory}
          setSelectedCategory={(cat) => { setSelectedCategory(cat); resetNavigationFilter(); }}
          priceFilter={priceFilter}
          setPriceFilter={(pf) => { setPriceFilter(pf); resetNavigationFilter(); }}
          pubDateFilter={pubDateFilter}
          setPubDateFilter={(pdf) => { setPubDateFilter(pdf); resetNavigationFilter(); }}
          activeTab={activeTab}
          onNavigate={(tab) => { setActiveTab(tab); resetNavigationFilter(); }}
        />

        {/* Tab content controller */}
        <main className="flex-1 p-6 md:p-8 overflow-hidden bg-white border-l border-gray-100">

          {/* TAB 1: MAIN HOMEPAGE VIEW */}
          {activeTab === 'home' && (
            <div className="space-y-10 animate-in fade-in duration-300">
              
              {/* Massive Hero Banner Section */}
              <section className="relative rounded-xl overflow-hidden text-white bg-gradient-to-br from-[#0077B6] to-[#005d90] min-h-[340px] flex items-center shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-12 w-full gap-6 items-center p-8 md:p-12 z-10">
                  
                  {/* Left written promotions */}
                  <div className="md:col-span-7 space-y-4 max-w-xl text-left">
                    <span className="inline-block bg-[#E83E8C] text-white text-xs font-black tracking-wider uppercase px-3 py-1 rounded-sm shadow-sm">
                      {lang === 'KO' ? '이달의 화제작' : 'Featured New Release'}
                    </span>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                      {lang === 'KO' ? (
                        <>문학적 상상력의 경계,<br />새로운 시대를 여는 베스트셀러</>
                      ) : (
                        <>Expanding Imaginative Boundaries & Stellar Classics</>
                      )}
                    </h1>
                    <p className="text-sm md:text-base opacity-90 leading-relaxed font-sans font-medium">
                      {lang === 'KO' 
                        ? '알라딘이 엄선한 최고의 신작들과 함께 깊어가는 계절을 만끽하세요.' 
                        : 'Immerse into our carefully curated novels. Satisfy your intellectual needs with modern masterworks.'}
                    </p>
                    <button 
                      onClick={handleCheckNow}
                      className="bg-white hover:bg-gray-100 active:scale-[0.98] text-[#0077B6] font-extrabold text-sm px-6 py-3 rounded shadow-lg transition-all flex items-center gap-2"
                    >
                      <span>{lang === 'KO' ? '지금 바로 확인하기' : 'Explore Now'}</span>
                      <ArrowRight className="w-4 h-4 text-[#0077B6]" />
                    </button>
                  </div>

                  {/* Right floating book graphic matching mock exactly */}
                  <div className="md:col-span-5 h-full flex items-center justify-center p-4">
                    <div className="relative w-40 md:w-52 h-60 shrink-0 transform rotate-6 hover:rotate-0 transition-all duration-500 hover:scale-[1.03] cursor-pointer" onClick={handleCheckNow}>
                      <img 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDksNKJGkRxG5lxXhieaVzmjlsZ0cnKMw4TWVOkGls9RPjKvaZN0tfhB0bLL1IiZxjw0VI1f7KRtjuYamFdIxcYjkWovbuc7Y5wprpUE35jY8BiI6pgG_JQL1-vywgV39aGaCezmeEZ6OTEh6PoFLWyURvR3OFHhCUYqsBu_Pvl9DsrHuzP0I6sbawqKF0Ct1sIpbpHs5a5XdEWDlGEal_KdsxcROYtrpeBAlgg54O01yx_K_mp5EJOyz_woAYv9tZWBSFYg1hDvZh" 
                        alt="Best seller float jacket cover" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover rounded-lg shadow-2xl"
                      />
                    </div>
                  </div>

                </div>
              </section>

              {/* Today's Best Sellers Layout index */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <h2 className="text-xl font-bold text-[#0077B6] tracking-tight flex items-center gap-2">
                    <span>{lang === 'KO' ? "Today's Best Sellers" : "Today's Best Sellers"}</span>
                    <span className="text-gray-500 font-medium text-xs font-sans mt-1">
                      {lang === 'KO' ? '(2026년 6월 8일 기준)' : '(As of June 8, 2026)'}
                    </span>
                  </h2>
                  <button 
                    onClick={() => { setSelectedCategory(''); setActiveTab('search'); }}
                    className="text-xs font-bold text-[#0077B6] hover:underline"
                  >
                    {lang === 'KO' ? '더보기' : 'See More'}
                  </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  {bestsellerBooks.map((book, idx) => (
                    <BookCard 
                      key={book.id} 
                      book={book} 
                      rank={idx + 1}
                      lang={lang}
                      onAddToCart={handleAddToCart}
                      onSelect={(b) => setSelectedBook(b)}
                    />
                  ))}
                </div>
              </section>

              {/* Editors Choice Bento grid wrapper */}
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-[#0077B6] tracking-tight">
                  {lang === 'KO' ? "Editor's Choice" : "Editor's Choice"}
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Left Big Bento Grid highlight Column */}
                  <div 
                    onClick={() => setSelectedBook(editorsChoiceBook)}
                    className="lg:col-span-7 border border-gray-200 bg-[#F4F4F4]/70 p-6 rounded-lg flex flex-col md:flex-row gap-6 items-center group cursor-pointer hover:shadow-md hover:border-gray-300 transition-all text-left"
                  >
                    <div className="w-36 md:w-44 aspect-[2/3] shrink-0 overflow-hidden bg-white shadow-md rounded">
                      <img 
                        src={editorsChoiceBook.image} 
                        alt="Editor Chosen book cover" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                    
                    <div className="flex-grow space-y-3">
                      <div className="flex gap-2">
                        <span className="bg-[#0077B6] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {lang === 'KO' ? '주목할 만한 상학' : 'MUST READ'}
                        </span>
                        <span className="bg-gray-200 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {lang === 'KO' ? '인문 사회' : 'HUMANITIES'}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-base text-gray-900 group-hover:text-[#0077B6] transition-colors leading-snug">
                        {lang === 'KO' ? editorsChoiceBook.title : editorsChoiceBook.titleEn}
                      </h3>
                      
                      <p className="text-xs text-gray-500 font-semibold">
                        {lang === 'KO' ? editorsChoiceBook.author : editorsChoiceBook.authorEn} 지음 | {lang === 'KO' ? editorsChoiceBook.publisher : editorsChoiceBook.publisherEn}
                      </p>

                      <p className="text-xs text-gray-600 leading-relaxed font-medium line-clamp-3">
                        {lang === 'KO' ? editorsChoiceBook.desc : editorsChoiceBook.descEn}
                      </p>

                      <button 
                        className="text-xs font-bold text-[#0077B6] flex items-center gap-1 group-hover:translate-x-1 transition-transform pt-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBook(editorsChoiceBook);
                        }}
                      >
                        <span>{lang === 'KO' ? '상세 내용 보기' : 'Read Full Details'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Right bento items blocks */}
                  <div className="lg:col-span-5 grid grid-rows-2 gap-4 text-left">
                    
                    {/* Item 1: Special event box */}
                    <div 
                      onClick={() => { setSelectedCategory('Literature'); setActiveTab('search'); }}
                      className="bg-[#0077b6] text-white p-5 rounded-lg flex items-center justify-between border border-blue-700 relative overflow-hidden group cursor-pointer shadow-xs select-none"
                    >
                      <div className="space-y-1.5 relative z-10 max-w-[240px]">
                        <h4 className="text-base font-extrabold tracking-tight">
                          {lang === 'KO' ? '인문학 베스트 특별전' : 'Best of Humanities Sale'}
                        </h4>
                        <p className="text-xs opacity-90 leading-snug">
                          {lang === 'KO' ? '깊이 있는 사유를 위한 필독서 30선 단독 할인' : '30 selected must-read classics for critical thinking.'}
                        </p>
                        <span className="inline-block pt-1.5 text-xs font-bold underline cursor-pointer hover:opacity-100 opacity-90">
                          {lang === 'KO' ? '바로가기' : 'Go Now'}
                        </span>
                      </div>

                      {/* Small floating books graphic */}
                      <div className="relative z-10 w-16 h-22 shrink-0 transform rotate-12 group-hover:rotate-0 transition-transform duration-300">
                        <img 
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmWIPkZ-WiCYd8sMwbQOe6ReFxlYEBHDdS3gygtoDRoslBne6yMG1Lyd7LMoUq6PaoLekfz1YMcwAiBvRGqE1kTs0766qMIiWm-UTLTWEkR-l5rz7vP2kr1p9MCX5Z9uyCxqcu7Euk2zDAQdynDRq3rtaw8YX-me16UN4DfW80Z6r1tWmKfn5PLOM0UpuIsKKQ7UtstyPi4afI4-5kR-gJGJrXXD1HYwyiyz4BexYrG4NoQ762JVYbHC4948xn_J1x_m0b4GGNRVkJ" 
                          alt="Special promo books" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover rounded shadow-md border border-white/20"
                        />
                      </div>
                      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
                    </div>

                    {/* Item 2: Used Bookstore finder indicator */}
                    <div 
                      onClick={() => alert(lang === 'KO' ? '전국 알라딘 중고매장 조회 기능 준비 중입니다.' : 'Store lookup system coming soon!')}
                      className="bg-white p-5 rounded-lg border border-gray-200 flex items-center justify-between hover:border-[#0077B6] hover:shadow-xs transition-colors group cursor-pointer text-left select-none"
                    >
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-extrabold text-[#0077B6] uppercase tracking-wide">
                          {lang === 'KO' ? '알라딘 중고매장 주소안내' : 'Aladin Used Bookstores'}
                        </h4>
                        <p className="text-xs text-gray-500 font-medium">
                          {lang === 'KO' ? '가까운 매장을 방문하여 실시간 도서 재고를 확인하세요.' : 'Visit your local offline bookstore to inspect live stocks.'}
                        </p>
                        <div className="flex items-center gap-1.5 text-[#1c1b1b] text-xs font-bold pt-1">
                          <MapPin className="w-3.5 h-3.5 text-[#0077B6] shrink-0" />
                          <span>{lang === 'KO' ? '강남점 | 합정점 | 종로점' : 'Gangnam | Hapjeong | Jongro'}</span>
                        </div>
                      </div>
                      <Store className="w-8 h-8 text-gray-300 group-hover:text-[#0077B6] transition-colors shrink-0" />
                    </div>

                  </div>

                </div>
              </section>

            </div>
          )}

          {/* TAB 2: EXPLORER AND FILTER RESULTS (LISTINGS VIEW) */}
          {activeTab === 'search' && (
            <div className="space-y-6 animate-in fade-in duration-300 select-none">
              
              {/* Heading parameters header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-200 pb-3 flex-wrap gap-4">
                <div>
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight select-all">
                    {lang === 'KO' ? (
                      activeSearch.trim() ? `'${activeSearch}' 검색 결과` : '전체 카테고리 도서 목록'
                    ) : (
                      activeSearch.trim() ? `Search Results for '${activeSearch}'` : 'General Catalog Books'
                    )}
                  </h1>
                  <p className="text-xs text-gray-500 font-semibold mt-1">
                    {lang === 'KO' ? (
                      <>총 <span className="text-[#0077B6] font-extrabold">{filteredBooks.length}</span>개의 도서가 매칭되어 있습니다.</>
                    ) : (
                      <>Found <span className="text-[#0077B6] font-extrabold">{filteredBooks.length}</span> books matches.</>
                    )}
                  </p>
                </div>

                {/* Direct filter sorting tab buttons */}
                <div className="flex gap-4 text-xs font-bold text-gray-500 shrink-0 select-none">
                  <button 
                    onClick={() => setSortOption('popular')}
                    className={`pb-1 transition-all border-b-2 ${sortOption === 'popular' ? 'border-[#0077B6] text-[#0077B6] font-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                  >
                    {lang === 'KO' ? '인기순(Popular)' : 'Popular'}
                  </button>
                  <button 
                    onClick={() => setSortOption('newest')}
                    className={`pb-1 transition-all border-b-2 ${sortOption === 'newest' ? 'border-[#0077B6] text-[#0077B6] font-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                  >
                    {lang === 'KO' ? '최신순(Newest)' : 'Newest'}
                  </button>
                  <button 
                    onClick={() => setSortOption('price')}
                    className={`pb-1 transition-all border-b-2 ${sortOption === 'price' ? 'border-[#0077B6] text-[#0077B6] font-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                  >
                    {lang === 'KO' ? '가격순(Price)' : 'Price'}
                  </button>
                </div>
              </div>

              {/* Grid / List collection rows */}
              {filteredBooks.length === 0 ? (
                <div className="py-20 text-center text-gray-400 font-sans border border-dashed border-gray-200 rounded bg-[#F4F4F4]/20 max-w-4xl mx-auto">
                  <span className="material-symbols-outlined text-5xl mb-4 font-light text-gray-300">sentiment_neutral</span>
                  <p className="font-semibold text-gray-500">
                    {lang === 'KO' ? '일치하는 도서를 찾을 수 없습니다' : 'No matching books found'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto leading-normal">
                    {lang === 'KO' 
                      ? '검색어 철자를 확인하시거나 가격대, 출간시기 필터를 변경해 보세요.' 
                      : 'Please check your spelling or adjust filters on the sidebar to inspect more matches.'}
                  </p>
                  <button 
                    onClick={() => { setSelectedCategory(''); setActiveSearch(''); setPriceFilter([]); setPubDateFilter('all'); }}
                    className="mt-4 px-4 py-1.5 bg-white border border-[#0077B6] text-[#0077B6] hover:bg-[#E5F1FC] font-bold text-xs rounded transition-all shadow-xs"
                  >
                    {lang === 'KO' ? '필터 리셋하기' : 'Reset All Filters'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-w-4xl">
                  {filteredBooks.map((book) => (
                    <BookListItem 
                      key={book.id}
                      book={book}
                      lang={lang}
                      isFavorited={favorites.includes(book.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onAddToCart={handleAddToCart}
                      onBuyNow={handleBuyNow}
                      onSelect={(b) => setSelectedBook(b)}
                    />
                  ))}
                </div>
              )}

              {/* Complex Page Pagination matching target design exactly */}
              {filteredBooks.length > 0 && (
                <div className="flex items-center justify-center gap-1.5 py-6 font-sans">
                  <button 
                    onClick={() => { if (currentPage > 1) setCurrentPage(currentPage - 1); }}
                    className="p-2 border border-gray-200 hover:bg-[#F4F4F4] text-gray-400 hover:text-gray-700 rounded transition-colors active:scale-95"
                    title={lang === 'KO' ? '이전 페이지' : 'Prev page'}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setCurrentPage(1)}
                    className={`w-9 h-9 font-extrabold text-xs transition-colors rounded ${currentPage === 1 ? 'bg-[#0077B6] text-white' : 'border border-gray-200 hover:bg-[#F4F4F4]'}`}
                  >
                    1
                  </button>
                  <button 
                    onClick={() => setCurrentPage(2)}
                    className={`w-9 h-9 font-extrabold text-xs transition-colors rounded ${currentPage === 2 ? 'bg-[#0077B6] text-white' : 'border border-gray-200 hover:bg-[#F4F4F4]'}`}
                  >
                    2
                  </button>
                  <button 
                    onClick={() => setCurrentPage(3)}
                    className={`w-9 h-9 font-extrabold text-xs transition-colors rounded ${currentPage === 3 ? 'bg-[#0077B6] text-white' : 'border border-gray-200 hover:bg-[#F4F4F4]'}`}
                  >
                    3
                  </button>
                  <button 
                    onClick={() => setCurrentPage(4)}
                    className={`w-9 h-9 font-extrabold text-xs transition-colors rounded ${currentPage === 4 ? 'bg-[#0077B6] text-white' : 'border border-gray-200 hover:bg-[#F4F4F4]'}`}
                  >
                    4
                  </button>
                  <button 
                    onClick={() => setCurrentPage(5)}
                    className={`w-9 h-9 font-extrabold text-xs transition-colors rounded ${currentPage === 5 ? 'bg-[#0077B6] text-white' : 'border border-gray-200 hover:bg-[#F4F4F4]'}`}
                  >
                    5
                  </button>
                  <span className="text-gray-300 font-bold px-1 select-none">...</span>
                  <button 
                    onClick={() => { setCurrentPage(125); alert('Last page simulated results!'); }}
                    className="w-9 h-9 font-bold text-xs border border-gray-200 hover:bg-[#F4F4F4] transition-colors rounded"
                  >
                    125
                  </button>
                  <button 
                    onClick={() => { if (currentPage < 5) setCurrentPage(currentPage + 1); }}
                    className="p-2 border border-gray-200 hover:bg-[#F4F4F4] text-gray-400 hover:text-gray-700 rounded transition-colors active:scale-95"
                    title={lang === 'KO' ? '다음 페이지' : 'Next page'}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: CUSTOM LIKED (찜 목록) COMPONENT */}
          {activeTab === 'favorites' && (
            <div className="space-y-6 animate-in fade-in duration-300 select-none">
              <div className="border-b border-gray-200 pb-3 flex justify-between items-center text-left">
                <div>
                  <h1 className="text-2xl font-black text-[#E83E8C] tracking-tight">
                    {lang === 'KO' ? '나의 찜 목록' : 'My Wishlist'}
                  </h1>
                  <p className="text-xs text-gray-500 font-semibold mt-1">
                    {lang === 'KO' ? '내가 관심 있거나 나중에 구매하려고 담아 둔 명작 평론 목록입니다.' : 'Collection of books you bookmarked.'}
                  </p>
                </div>
                <span className="bg-[#E83E8C]/10 text-[#E83E8C] text-xs font-bold px-3 py-1 rounded-full shrink-0">
                  {lang === 'KO' ? `총 ${favoritedBooksList.length}개` : `${favoritedBooksList.length} total`}
                </span>
              </div>

              {favoritedBooksList.length === 0 ? (
                <div className="py-20 text-center text-gray-400 font-sans border border-dashed border-gray-200 rounded max-w-4xl mx-auto">
                  <span className="material-symbols-outlined text-5xl mb-4 font-light text-rose-300">favorite</span>
                  <p className="font-semibold text-gray-500">
                    {lang === 'KO' ? '비어 있는 찜 목록입니다' : 'No favorited books detected'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto leading-normal">
                    {lang === 'KO' 
                      ? '도서 목록에서 하트 문양 "찜하기" 아이콘을 누르면 나만의 라이브러리를 만들 실 수 있어요!' 
                      : 'Click favorite hearts on list rows to construct your own custom readings collections!'}
                  </p>
                  <button 
                    onClick={() => { setSelectedCategory(''); setActiveSearch(''); setActiveTab('home'); }}
                    className="mt-4 px-5 py-2 bg-[#E83E8C] hover:bg-rose-600 text-white font-bold text-xs rounded transition-all shadow-sm"
                  >
                    {lang === 'KO' ? '베스트 주력작 구경가기' : 'Check Best Sellers'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-w-4xl">
                  {favoritedBooksList.map((book) => (
                    <BookListItem 
                      key={book.id}
                      book={book}
                      lang={lang}
                      isFavorited={true}
                      onToggleFavorite={handleToggleFavorite}
                      onAddToCart={handleAddToCart}
                      onBuyNow={handleBuyNow}
                      onSelect={(b) => setSelectedBook(b)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Structured Modern Footer Section */}
      <footer className="bg-[#F4F4F4] text-left border-t border-gray-200 mt-auto py-10 font-sans">
        <div className="max-w-[1240px] px-6 mx-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-4 mb-8">
            
            {/* Column 1: Info and brand socials */}
            <div className="md:col-span-4 space-y-4">
              <span className="block font-black text-sm text-[#0077B6] tracking-wider uppercase">
                Aladin Communication
              </span>
              <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-xs">
                {lang === 'KO' 
                  ? '알라딘은 독자 여러분께 가장 빠르고 정확한 도서 정보를 제공하며, 최고의 독서 경험을 선사하기 위해 끊임없이 노력합니다.' 
                  : 'Aladin delivers accurate descriptions and swift courier systems to provide stellar reading experiences.'}
              </p>
              <div className="flex gap-4 items-center">
                <button className="text-gray-400 hover:text-[#0077B6] transition-colors">
                  <span className="material-symbols-outlined text-lg">face_nod</span>
                </button>
                <button className="text-gray-400 hover:text-[#0077B6] transition-colors">
                  <Play className="w-4 h-4" />
                </button>
                <button className="text-gray-400 hover:text-[#0077B6] transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Column 2: Navigation Links */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                {lang === 'KO' ? '서비스 안내' : 'Service Support'}
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-500 font-medium font-sans">
                <li><a href="#" className="hover:underline">{lang === 'KO' ? '회사 소개' : 'About Us'}</a></li>
                <li><a href="#" className="hover:underline">{lang === 'KO' ? '고객 센터' : 'Customer Service'}</a></li>
                <li><a href="#" className="hover:underline">{lang === 'KO' ? '자주 묻는 질문' : 'FAQ'}</a></li>
              </ul>
            </div>

            {/* Column 3: Legislation Rules */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest animate-pulse">
                {lang === 'KO' ? '이용 약관 정책' : 'Policies'}
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-500 font-semibold font-sans">
                <li><a href="#" className="hover:underline text-[#E83E8C]">{lang === 'KO' ? '개인정보 처리방침' : 'Privacy Policy'}</a></li>
                <li><a href="#" className="hover:underline">{lang === 'KO' ? '이용 약관' : 'Terms of Service'}</a></li>
              </ul>
            </div>

            {/* Column 4: Contact index lines */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                {lang === 'KO' ? '전화 및 소통창구' : 'Contact Us'}
              </h4>
              <p className="text-xs text-gray-600 font-bold">
                1544-2514 <br />
                <span className="text-gray-400 font-semibold">{lang === 'KO' ? '(평일 09:00~18:00)' : '(09:00~18:00 KST)'}</span>
              </p>
              <p className="text-xs text-[#0077B6] font-bold">
                aladin@aladin.co.kr
              </p>
            </div>

          </div>

          {/* Border-t division footer logo seals */}
          <div className="pt-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 select-none">
            
            <p className="text-[11px] text-gray-400 font-semibold">
              © 2026 Aladin Communication. All Rights Reserved.
            </p>

            {/* Seals of security and pay mechanisms */}
            <div className="flex gap-6 items-center flex-wrap select-none">
              <div className="flex gap-1 items-center bg-white border border-gray-200 px-2.5 py-1 rounded shadow-xs shrink-0 select-none">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB03NA3IDSgsvDQv_m3kAhIddj_TFdaF9tnDqB4NeGzTlxy3byhEyKh9WhWhJJ9gUMrFPYB_ZMJEoPPl48uinEI1UWNJMv_M0OGuoHGEWLe-_XjPWz1IA9i3DaCGlzHt2HngPxv_LamewffVhvnFghjIGgylkQImoz93RzoTi5u16778qf7rm3rZSKKRWbx0k8RO2WNc5lkc0zcySU7WePPIo1dBCcziVvnh2evSfrOMUK37yn2k7zLIw_FxRsgjTeCE4SYQRX4YWpR" 
                  alt="ISMS authentication logo security" 
                  referrerPolicy="no-referrer"
                  className="h-5 object-contain"
                />
                <span className="text-[9px] text-gray-400 font-bold">ISMS</span>
              </div>

              <div className="flex gap-1.5 text-gray-400 font-sans text-xs">
                <span className="material-symbols-outlined text-lg">payments</span>
                <span className="material-symbols-outlined text-lg">credit_card</span>
              </div>
            </div>

          </div>

        </div>
      </footer>

      {/* Absolute slide over Shopping cart side Drawer component */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        lang={lang}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
      />

      {/* Book details pop-up modal component */}
      <BookDetailModal 
        book={selectedBook}
        isOpen={selectedBook !== null}
        onClose={() => setSelectedBook(null)}
        lang={lang}
        onAddToCart={handleAddToCart}
        isFavorited={selectedBook ? favorites.includes(selectedBook.id) : false}
        onToggleFavorite={handleToggleFavorite}
        reviewsList={selectedBook ? getReviewsForBook(selectedBook.id) : []}
        onAddReview={handleAddReview}
      />

    </div>
  );
}
