export interface Book {
  id: string;
  title: string;
  titleEn?: string;
  author: string;
  authorEn: string;
  publisher: string;
  publisherEn: string;
  pubDate: string;
  image: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewsCount: number;
  category: 'Literature' | 'Business' | 'Science' | 'Arts' | 'Computers' | 'Children';
  desc: string;
  descEn: string;
  tag?: 'Best' | 'New' | '10% Off' | 'Classic' | 'Must Read';
  details?: {
    isbn: string;
    pages: number;
    tableOfContents: string[];
    authorIntro: string;
    authorIntroEn: string;
  };
}

export interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  commentEn: string;
  date: string;
}

export interface CartItem {
  bookId: string;
  quantity: number;
}
