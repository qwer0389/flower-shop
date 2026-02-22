import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';

// --- Data & Types ---
const DEFAULT_CONTENT = {
  logoUrl: "https://instagram.fvno8-1.fna.fbcdn.net/v/t51.2885-19/600047485_17846829945606385_5783144591782870466_n.jpg?stp=dst-jpg_s150x150_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby41MDAuYzIifQ&_nc_ht=instagram.fvno8-1.fna.fbcdn.net&_nc_cat=101&_nc_oc=Q6cZ2QEHIwDxByrz4rm0gs--MdFQDa7D-M6oFh-6q92eweMMxIM3yICuhLTcKiUVu_0oBA0&_nc_ohc=7c-ZUbXwJFoQ7kNvwHUaRX1&_nc_gid=mebsOZRk9TWWEYA5vmhe9g&edm=APoiHPcBAAAA&ccb=7-5&oh=00_AftYLCt9gm72iwoNytvpVvO3Yu0hWF1OZmR4Y4qWU-O4Cg&oe=69A11B9A&_nc_sid=22de04",
  heroTitle: "Свежие цветы с доставкой <br class='hidden md:block' /> на дом",
  heroSubtitle: "Создайте свой идеальный букет для любого повода. Свежие, красивые, собранные вручную.",
  products: [
    { id: 1, name: 'Букет роз', emoji: '🌹', imageUrl: '', price: 2500, category: 'Розы' },
    { id: 2, name: 'Тюльпаны', emoji: '🌷', imageUrl: '', price: 1500, category: 'Тюльпаны' },
    { id: 3, name: 'Подсолнухи', emoji: '🌻', imageUrl: '', price: 1800, category: 'Подсолнухи' },
    { id: 4, name: 'Ромашки', emoji: '🌼', imageUrl: '', price: 1600, category: 'Ромашки' },
    { id: 5, name: 'Экзотика', emoji: '🌺', imageUrl: '', price: 3500, category: 'Экзотика' },
    { id: 6, name: 'Пионы', emoji: '🌸', imageUrl: '', price: 3200, category: 'Пионы' },
  ]
};

type Product = typeof DEFAULT_CONTENT.products[0];
type CartItem = { product: Product; quantity: number; };

// --- Context ---
const AdminContext = createContext({ isAdmin: false, setIsAdmin: (v: boolean) => {} });
const useAdmin = () => useContext(AdminContext);

// --- Editable Components ---
const EditableText = ({ value, onChange, className, as: Component = 'span' }: any) => {
  const { isAdmin } = useAdmin();
  const ref = useRef<HTMLElement>(null);

  if (!isAdmin) {
    return <Component className={className} dangerouslySetInnerHTML={{ __html: value }} />;
  }

  return (
    <Component 
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      className={`outline-none hover:outline hover:outline-2 hover:outline-blue-500 hover:outline-dashed transition-all cursor-text ${className}`}
      onBlur={(e: any) => onChange(e.currentTarget.innerHTML)}
      dangerouslySetInnerHTML={{ __html: value }}
    />
  );
};

const EditableImage = ({ src, emoji, onChange, className }: any) => {
  const { isAdmin } = useAdmin();

  const handleClick = () => {
    if (!isAdmin) return;
    const newUrl = prompt('Введите URL нового изображения (или оставьте пустым для эмодзи):', src || '');
    if (newUrl !== null) {
      onChange(newUrl);
    }
  };

  const content = src ? <img src={src} alt="" className="w-full h-full object-cover rounded-full" /> : emoji;

  if (!isAdmin) {
    return <div className={className}>{content}</div>;
  }

  return (
    <div 
      className={`cursor-pointer hover:outline hover:outline-2 hover:outline-blue-500 hover:outline-dashed transition-all relative group ${className}`}
      onClick={handleClick}
    >
      {content}
      <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-full text-sm font-bold">
        Изменить
      </div>
    </div>
  );
};

const EditablePrice = ({ value, onChange, className }: any) => {
  const { isAdmin } = useAdmin();
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());

  if (!isAdmin) {
    return <span className={className}>{value.toLocaleString('ru-RU')} ₽</span>;
  }

  if (isEditing) {
    return (
      <input
        autoFocus
        type="number"
        className={`bg-white text-black border border-blue-500 p-1 rounded w-24 text-center ${className}`}
        value={tempValue}
        onChange={e => setTempValue(e.target.value)}
        onBlur={() => { setIsEditing(false); onChange(Number(tempValue) || 0); }}
        onKeyDown={e => { if (e.key === 'Enter') { setIsEditing(false); onChange(Number(tempValue) || 0); } }}
      />
    );
  }

  return (
    <span 
      className={`cursor-pointer hover:outline hover:outline-2 hover:outline-blue-500 hover:outline-dashed transition-all ${className}`}
      onClick={() => setIsEditing(true)}
    >
      {value.toLocaleString('ru-RU')} ₽
    </span>
  );
};

// --- Storefront Component ---
function Storefront({ content, setContent }: { content: typeof DEFAULT_CONTENT, setContent: any }) {
  const { isAdmin, setIsAdmin } = useAdmin();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Logo Edit State
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isLogoDragging, setIsLogoDragging] = useState(false);
  const [tempLogo, setTempLogo] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const updateContent = (key: string, value: string) => {
    setContent((prev: any) => ({ ...prev, [key]: value }));
  };

  const updateProduct = (id: number, key: string, value: any) => {
    setContent((prev: any) => ({
      ...prev,
      products: prev.products.map((p: any) => p.id === id ? { ...p, [key]: value } : p)
    }));
  };

  const addToCart = (product: Product) => {
    if (isAdmin) {
      alert('Покупки отключены в режиме редактирования.');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleCheckoutSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const comment = formData.get('comment') as string;
    
    const botToken = '8551159398:AAFFLVpjiT663I3ZwYfeNuD5lOJWPQ8WfDo';
    const chatId = '7247068220';
    
    const orderDetails = cart.map(item => `${item.product.emoji} ${item.product.name} x${item.quantity} - ${item.product.price * item.quantity} ₽`).join('\n');
    const text = `🌸 Новый заказ!\n\n👤 Имя: ${name}\n📞 Телефон: ${phone}\n💬 Комментарий: ${comment || 'Нет'}\n\n🛍️ Детали заказа:\n${orderDetails}\n\n💰 Итого: ${cartTotal.toLocaleString('ru-RU')} ₽`;

    setIsSubmitting(true);
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: text }),
      });

      if (response.ok) {
        alert('Заказ принят!');
        setCart([]);
        setIsModalOpen(false);
      } else {
        alert('Не удалось отправить заказ. Пожалуйста, попробуйте еще раз.');
      }
    } catch (error) {
      console.error('Telegram API Error:', error);
      alert('Произошла ошибка при отправке заказа.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Logo Handlers
  const handleLogoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsLogoDragging(true);
  };

  const handleLogoDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsLogoDragging(false);
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsLogoDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoFile(e.dataTransfer.files[0]);
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleLogoFile(e.target.files[0]);
    }
  };

  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, загрузите изображение');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setTempLogo(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const saveLogo = () => {
    if (tempLogo) {
      updateContent('logoUrl', tempLogo);
      setIsLogoModalOpen(false);
      alert('Логотип обновлен');
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 flex flex-col">
      {isAdmin && (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white px-4 py-2 rounded-full shadow-2xl z-50 flex items-center gap-4">
          <span className="text-sm font-medium">Режим редактирования</span>
          <button onClick={() => setIsAdmin(false)} className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors">Выйти</button>
        </div>
      )}

      {/* --- Header --- */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-pink-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a 
            href="/" 
            className="flex items-center gap-3 hover:opacity-80 transition-opacity relative group"
            onClick={(e) => {
              if (isAdmin) {
                e.preventDefault();
                setTempLogo(content.logoUrl);
                setIsLogoModalOpen(true);
              }
            }}
            title={isAdmin ? "Нажмите для редактирования / Перетащите фото" : ""}
          >
            <div className="relative">
              <img 
                src={content.logoUrl} 
                alt="POLE FLOWERS Logo" 
                className="w-[50px] h-[50px] rounded-full object-cover"
              />
              {isAdmin && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-full transition-opacity cursor-pointer">
                  <span className="text-white text-xs">✏️</span>
                </div>
              )}
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight font-serif uppercase">POLE FLOWERS</span>
          </a>
          
          <nav className="hidden md:flex items-center gap-8 font-medium text-slate-600">
            <a href="#" className="hover:text-pink-500 transition-colors">Главная</a>
            <a href="#catalog" className="hover:text-pink-500 transition-colors">Каталог</a>
            <a href="#contact" className="hover:text-pink-500 transition-colors">Контакты</a>
          </nav>

          <div className="flex items-center">
            <a href="#cart" className="relative p-2 text-slate-600 hover:text-pink-500 transition-colors flex items-center gap-2">
              <span className="text-2xl">🛒</span>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-pink-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center transform translate-x-1 -translate-y-1">
                  {cartCount}
                </span>
              )}
            </a>
          </div>
        </div>
      </header>

      {/* --- Hero --- */}
      <section className="bg-gradient-to-br from-pink-50 to-teal-50 py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="font-serif text-2xl md:text-3xl text-pink-500 font-bold tracking-widest uppercase mb-6 drop-shadow-sm">
            POLE FLOWERS
          </div>
          <EditableText 
            as="h1"
            value={content.heroTitle} 
            onChange={(v: string) => updateContent('heroTitle', v)}
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 mb-6 leading-tight block drop-shadow-md"
          />
          <EditableText 
            as="p"
            value={content.heroSubtitle} 
            onChange={(v: string) => updateContent('heroSubtitle', v)}
            className="text-lg md:text-xl text-slate-600 mb-10 block"
          />
          <a 
            href="#catalog" 
            className="inline-block bg-pink-500 hover:bg-pink-600 text-white font-semibold text-lg px-8 py-4 rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            Перейти в каталог
          </a>
        </div>
      </section>

      {/* --- Main Content (Catalog + Cart) --- */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex flex-col lg:flex-row gap-12">
        
        {/* Catalog Section */}
        <section id="catalog" className="flex-1">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
            Наши букеты
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {content.products.map((product) => (
              <div 
                key={product.id} 
                className="bg-white border border-pink-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center group"
              >
                <EditableImage 
                  src={product.imageUrl}
                  emoji={product.emoji}
                  onChange={(v: string) => updateProduct(product.id, 'imageUrl', v)}
                  className="w-32 h-32 rounded-full bg-pink-50 flex items-center justify-center text-6xl mb-6 group-hover:scale-105 transition-transform duration-300"
                />
                <EditableText 
                  as="h3"
                  value={product.name}
                  onChange={(v: string) => updateProduct(product.id, 'name', v)}
                  className="text-xl font-bold text-slate-800 mb-2 block"
                />
                <div className="text-lg font-medium text-teal-600 mb-6">
                  <EditablePrice 
                    value={product.price}
                    onChange={(v: number) => updateProduct(product.id, 'price', v)}
                  />
                </div>
                <button 
                  onClick={() => addToCart(product)}
                  className="mt-auto w-full bg-pink-100 hover:bg-pink-500 text-pink-600 hover:text-white font-semibold py-3 px-6 rounded-2xl transition-colors"
                >
                  В корзину
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Cart Section */}
        <aside id="cart" className="w-full lg:w-96 shrink-0">
          <div className="bg-slate-50 rounded-3xl p-6 lg:sticky lg:top-24 border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Ваша корзина</h2>
            
            {cart.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <span className="text-4xl block mb-4 opacity-50">🛒</span>
                Ваша корзина пуста
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto max-h-[50vh] pr-2 space-y-4 mb-6">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                      <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                        {item.product.imageUrl ? <img src={item.product.imageUrl} alt="" className="w-full h-full object-cover" /> : item.product.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-800 truncate" dangerouslySetInnerHTML={{ __html: item.product.name }} />
                        <div className="text-sm text-slate-500">
                          {item.product.price.toLocaleString('ru-RU')} ₽
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <button 
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors text-sm"
                          title="Удалить"
                        >
                          🗑️
                        </button>
                        <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200 px-1">
                          <button 
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-pink-500"
                          >
                            -
                          </button>
                          <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-pink-500"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-slate-200 pt-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600">Товары:</span>
                    <span className="font-medium">{cartCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold text-slate-900">
                    <span>Итого:</span>
                    <span className="text-pink-500">{cartTotal.toLocaleString('ru-RU')} ₽</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 rounded-2xl shadow-md hover:shadow-lg transition-all"
                >
                  Оформить заказ
                </button>
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* --- Footer --- */}
      <footer id="contact" className="bg-slate-900 text-slate-300 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🌸</span>
              <span className="text-xl font-bold text-white tracking-tight">Цветочный Рай</span>
            </div>
            <p className="text-slate-400 text-sm">
              Доставляем счастье и свежие цветы прямо к вашей двери.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Связаться с нами</h4>
            <ul className="space-y-2 text-sm">
              <li>📞 +7 (555) 123-45-67</li>
              <li>✉️ hello@flowerparadise.com</li>
              <li>📍 Цветочная ул., 123, Весенний</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Мы в соцсетях</h4>
            <div className="flex gap-4 text-xl">
              <a href="#" className="hover:text-pink-400 transition-colors"><i className="fa-brands fa-instagram"></i></a>
              <a href="#" className="hover:text-pink-400 transition-colors"><i className="fa-brands fa-facebook"></i></a>
              <a href="#" className="hover:text-pink-400 transition-colors"><i className="fa-brands fa-twitter"></i></a>
              <a href="#" className="hover:text-pink-400 transition-colors"><i className="fa-brands fa-pinterest"></i></a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-sm text-center text-slate-500">
          &copy; {new Date().getFullYear()} Цветочный Рай. Все права защищены.
        </div>
      </footer>

      {/* --- Checkout Modal --- */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="text-xl font-bold text-slate-900">Оформление заказа</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCheckoutSubmit} className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Имя</label>
                  <input required type="text" id="name" name="name" className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all" placeholder="Иван Иванов" />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Телефон</label>
                  <input required type="tel" id="phone" name="phone" className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all" placeholder="+375 (29) 000-00-00" />
                </div>
                
                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-slate-700 mb-1">Комментарий к заказу</label>
                  <textarea id="comment" name="comment" rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all resize-none" placeholder="Есть особые пожелания?"></textarea>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-slate-600 font-medium">К оплате:</span>
                  <span className="text-2xl font-bold text-pink-500">{cartTotal.toLocaleString('ru-RU')} ₽</span>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                  >
                    Отмена
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] px-4 py-3 bg-pink-500 text-white rounded-xl font-bold shadow-md hover:bg-pink-600 hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Отправка...' : 'Оформить заказ'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* --- Logo Edit Modal --- */}
      {isLogoModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsLogoModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="text-xl font-bold text-slate-900">Редактировать логотип</h3>
              <button 
                onClick={() => setIsLogoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Загрузить фото</label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${isLogoDragging ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400 bg-slate-50'}`}
                  onDragOver={handleLogoDragOver}
                  onDragLeave={handleLogoDragLeave}
                  onDrop={handleLogoDrop}
                  onClick={() => logoInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={logoInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleLogoFileChange} 
                  />
                  {tempLogo ? (
                    <div className="relative inline-block">
                      <img src={tempLogo} alt="Preview" className="w-32 h-32 object-cover rounded-full shadow-sm" />
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setTempLogo(null); }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md hover:bg-red-600"
                        title="Удалить фото"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="text-slate-500 flex flex-col items-center">
                      <i className="fa-solid fa-cloud-arrow-up text-3xl mb-2 text-slate-400"></i>
                      <span className="text-sm font-medium">Перетащите фото сюда или нажмите для выбора</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Или вставьте ссылку (URL)</label>
                <input 
                  type="url" 
                  value={tempLogo || ''}
                  onChange={(e) => setTempLogo(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" 
                  placeholder="https://example.com/logo.jpg" 
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsLogoModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-white transition-colors"
              >
                Отмена
              </button>
              <button 
                onClick={saveLogo}
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold shadow-md hover:bg-emerald-600 transition-colors"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Admin Login Component ---
function AdminLogin() {
  const { isAdmin, setIsAdmin } = useAdmin();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@flowers.ru' && password === 'admin123') {
      setIsAdmin(true);
      navigate('/admin/dashboard');
    } else {
      setError('Неверный email или пароль');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans text-slate-800">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm border border-slate-100">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🌸</div>
          <h2 className="text-2xl font-bold text-slate-900">Вход в админ-панель</h2>
        </div>
        
        {error && <div className="bg-red-50 text-red-500 p-3 rounded-xl mb-6 text-sm font-medium text-center">{error}</div>}
        
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all" required placeholder="admin@flowers.ru" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Пароль</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all" required placeholder="••••••••" />
          </div>
        </div>
        
        <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-md">
          Войти
        </button>
        
        <div className="mt-6 text-center text-sm text-slate-500">
          <a href="/" className="hover:text-pink-500 transition-colors">← Вернуться в магазин</a>
        </div>
      </form>
    </div>
  );
}

// --- Admin Dashboard Component ---
function AdminDashboard({ content, setContent }: { content: typeof DEFAULT_CONTENT, setContent: any }) {
  const { isAdmin, setIsAdmin } = useAdmin();
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleLogout = () => {
    setIsAdmin(false);
    navigate('/admin');
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      setContent((prev: any) => ({
        ...prev,
        products: prev.products.filter((p: any) => p.id !== productToDelete.id)
      }));
      setProductToDelete(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, загрузите изображение');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddProductSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const price = Number(formData.get('price'));
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const imageUrl = uploadedImage || 'https://picsum.photos/seed/flower/400/400';

    if (!name || isNaN(price)) {
      alert('Пожалуйста, корректно заполните название и цену');
      return;
    }

    if (editingProduct) {
      setContent((prev: any) => ({
        ...prev,
        products: prev.products.map((p: any) => 
          p.id === editingProduct.id 
            ? { ...p, name, price, category, imageUrl, description } 
            : p
        )
      }));
    } else {
      const newProduct = {
        id: Date.now(),
        name,
        price,
        category,
        imageUrl,
        description,
        emoji: '🌸'
      };

      setContent((prev: any) => ({
        ...prev,
        products: [...prev.products, newProduct]
      }));
    }

    setIsAddModalOpen(false);
    setEditingProduct(null);
    setUploadedImage(null);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setUploadedImage(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setUploadedImage(product.imageUrl || null);
    setIsAddModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <span className="text-2xl">🌸</span>
          <span className="text-xl font-bold text-white tracking-tight">Админ-панель</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 bg-pink-500/10 text-pink-500 px-4 py-3 rounded-xl font-medium transition-colors">
            📦 Товары
          </a>
          <a href="/" className="flex items-center gap-3 hover:bg-slate-800 px-4 py-3 rounded-xl font-medium transition-colors">
            👁️ Просмотр сайта
          </a>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 hover:bg-slate-800 px-4 py-3 rounded-xl font-medium transition-colors text-red-400 hover:text-red-300">
            Выйти
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Управление товарами</h1>
            <button 
              onClick={openAddModal}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium shadow-sm transition-colors flex items-center gap-2"
            >
              <i className="fa-solid fa-plus"></i> Добавить товар
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm uppercase tracking-wider">
                    <th className="p-4 font-medium">Фото</th>
                    <th className="p-4 font-medium">Название</th>
                    <th className="p-4 font-medium">Цена</th>
                    <th className="p-4 font-medium">Категория</th>
                    <th className="p-4 font-medium text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {content.products.map((product, idx) => (
                    <tr key={product.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="p-4">
                        <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-2xl overflow-hidden border border-slate-100 shrink-0">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            product.emoji || '🌸'
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-900">
                        <span dangerouslySetInnerHTML={{ __html: product.name }} />
                      </td>
                      <td className="p-4 text-teal-600 font-medium whitespace-nowrap">
                        {product.price.toLocaleString('ru-RU')} ₽
                      </td>
                      <td className="p-4 text-slate-600">
                        {/* @ts-ignore */}
                        {product.category || 'Без категории'}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openEditModal(product)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                            title="Редактировать"
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Удалить"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* --- Add/Edit Product Modal --- */}
      {isAddModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => { setIsAddModalOpen(false); setEditingProduct(null); setUploadedImage(null); }}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="text-xl font-bold text-slate-900">
                {editingProduct ? `Редактировать товар: ${editingProduct.name.replace(/<[^>]*>?/gm, '')}` : 'Добавить товар'}
              </h3>
              <button 
                onClick={() => { setIsAddModalOpen(false); setEditingProduct(null); setUploadedImage(null); }}
                className="text-slate-400 hover:text-slate-600 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddProductSubmit} className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Название *</label>
                  <input required type="text" id="name" name="name" defaultValue={editingProduct?.name.replace(/<[^>]*>?/gm, '') || ''} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="Например: Букет роз" />
                </div>
                
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-slate-700 mb-1">Цена (₽) *</label>
                  <input required type="number" id="price" name="price" min="0" step="1" defaultValue={editingProduct?.price || ''} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="2500" />
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">Категория</label>
                  <select id="category" name="category" defaultValue={editingProduct?.category || 'Розы'} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white">
                    <option value="Розы">Розы</option>
                    <option value="Тюльпаны">Тюльпаны</option>
                    <option value="Пионы">Пионы</option>
                    <option value="Ромашки">Ромашки</option>
                    <option value="Подсолнухи">Подсолнухи</option>
                    <option value="Экзотика">Экзотика</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Фото товара</label>
                  <div 
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400 bg-slate-50'}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                    />
                    {uploadedImage ? (
                      <div className="relative inline-block">
                        <img src={uploadedImage} alt="Preview" className="w-32 h-32 object-cover rounded-xl shadow-sm" />
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setUploadedImage(null); }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md hover:bg-red-600"
                          title="Удалить фото"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="text-slate-500 flex flex-col items-center">
                        <i className="fa-solid fa-cloud-arrow-up text-3xl mb-2 text-slate-400"></i>
                        <span className="text-sm font-medium">Перетащите фото сюда или нажмите для выбора</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Описание</label>
                  {/* @ts-ignore */}
                  <textarea id="description" name="description" rows={3} defaultValue={editingProduct?.description || ''} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none" placeholder="Краткое описание букета..."></textarea>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => { setIsAddModalOpen(false); setEditingProduct(null); setUploadedImage(null); }}
                    className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                  >
                    Отмена
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] px-4 py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-md hover:bg-emerald-600 hover:shadow-lg transition-all"
                  >
                    Сохранить
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* --- Delete Confirmation Modal --- */}
      {productToDelete && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setProductToDelete(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              <i className="fa-solid fa-trash-can"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Удалить товар?</h3>
            <p className="text-slate-500 mb-6">
              Вы уверены, что хотите удалить <b>{productToDelete.name.replace(/<[^>]*>?/gm, '')}</b>? Это действие нельзя отменить.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setProductToDelete(null)}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
              >
                Отмена
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-bold shadow-md hover:bg-red-600 transition-colors"
              >
                Да, удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Floating Admin Bar Component ---
function FloatingAdminBar() {
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAdmin) return null;

  return (
    <div className="fixed bottom-4 left-0 z-[100] group pl-2 py-4">
      <div className="bg-slate-900/80 backdrop-blur-md text-white p-2 rounded-2xl shadow-lg flex flex-col gap-2 transform -translate-x-[85%] group-hover:translate-x-0 transition-transform duration-300 border border-slate-700/50">
        <button 
          onClick={() => navigate('/admin/dashboard')}
          className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-colors ${location.pathname === '/admin/dashboard' ? 'bg-pink-500/20 text-pink-400' : 'hover:bg-white/10'}`}
          title="Товары"
        >
          <span className="text-lg">📋</span>
          <span className="font-medium text-sm whitespace-nowrap">Товары</span>
        </button>
        <button 
          onClick={() => navigate('/')}
          className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-colors ${location.pathname === '/' ? 'bg-pink-500/20 text-pink-400' : 'hover:bg-white/10'}`}
          title="На сайт"
        >
          <span className="text-lg">🏠</span>
          <span className="font-medium text-sm whitespace-nowrap">На сайт</span>
        </button>
      </div>
    </div>
  );
}

// --- Main App Component ---
export default function App() {
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const [content, setContent] = useState(() => {
    const saved = localStorage.getItem('siteContent');
    return saved ? JSON.parse(saved) : DEFAULT_CONTENT;
  });

  useEffect(() => {
    localStorage.setItem('siteContent', JSON.stringify(content));
  }, [content]);

  useEffect(() => {
    localStorage.setItem('isAdmin', isAdmin.toString());
  }, [isAdmin]);

  return (
    <AdminContext.Provider value={{ isAdmin, setIsAdmin }}>
      <BrowserRouter>
        <FloatingAdminBar />
        <Routes>
          <Route path="/" element={<Storefront content={content} setContent={setContent} />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard content={content} setContent={setContent} />} />
        </Routes>
      </BrowserRouter>
    </AdminContext.Provider>
  );
}
