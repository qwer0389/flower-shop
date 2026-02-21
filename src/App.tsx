import React, { useState } from 'react';

// --- Data ---
const PRODUCTS = [
  { id: 1, name: 'Rose Bouquet', emoji: '🌹', price: 2500 },
  { id: 2, name: 'Tulips', emoji: '🌷', price: 1500 },
  { id: 3, name: 'Sunflowers', emoji: '🌻', price: 1800 },
  { id: 4, name: 'Daisies', emoji: '🌼', price: 1600 },
  { id: 5, name: 'Exotics', emoji: '🌺', price: 3500 },
  { id: 6, name: 'Peonies', emoji: '🌸', price: 3200 },
];

// --- Types ---
type CartItem = {
  product: typeof PRODUCTS[0];
  quantity: number;
};

export default function App() {
  // --- State ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Derived State ---
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // --- Handlers ---
  const addToCart = (product: typeof PRODUCTS[0]) => {
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
    const email = formData.get('email') as string;
    const address = formData.get('address') as string;
    const comment = formData.get('comment') as string;
    
    const botToken = '8551159398:AAFFLVpjiT663I3ZwYfeNuD5lOJWPQ8WfDo';
    const chatId = '7247068220';
    
    const orderDetails = cart.map(item => `${item.product.emoji} ${item.product.name} x${item.quantity} - ${item.product.price * item.quantity} ₽`).join('\n');
    const text = `🌸 New Order!\n\n👤 Name: ${name}\n📞 Phone: ${phone}\n✉️ Email: ${email}\n📍 Address: ${address}\n💬 Comment: ${comment || 'None'}\n\n🛍️ Order Details:\n${orderDetails}\n\n💰 Total: ${cartTotal.toLocaleString('ru-RU')} ₽`;

    setIsSubmitting(true);
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
        }),
      });

      if (response.ok) {
        alert('Order accepted!');
        setCart([]);
        setIsModalOpen(false);
      } else {
        alert('Failed to submit order. Please try again.');
      }
    } catch (error) {
      console.error('Telegram API Error:', error);
      alert('An error occurred while sending the order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 flex flex-col">
      {/* --- Header --- */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-pink-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌸</span>
            <span className="text-xl font-bold text-pink-500 tracking-tight">Flower Paradise</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 font-medium text-slate-600">
            <a href="#" className="hover:text-pink-500 transition-colors">Home</a>
            <a href="#catalog" className="hover:text-pink-500 transition-colors">Catalog</a>
            <a href="#delivery" className="hover:text-pink-500 transition-colors">Delivery</a>
            <a href="#contact" className="hover:text-pink-500 transition-colors">Contact</a>
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
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
            Fresh flowers delivered <br className="hidden md:block" /> to your home
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10">
            Create your perfect bouquet for any occasion. Hand-picked, fresh, and beautiful.
          </p>
          <a 
            href="#catalog" 
            className="inline-block bg-pink-500 hover:bg-pink-600 text-white font-semibold text-lg px-8 py-4 rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            Go to catalog
          </a>
        </div>
      </section>

      {/* --- Main Content (Catalog + Cart) --- */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex flex-col lg:flex-row gap-12">
        
        {/* Catalog Section */}
        <section id="catalog" className="flex-1">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
            Our bouquets
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {PRODUCTS.map((product) => (
              <div 
                key={product.id} 
                className="bg-white border border-pink-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center group"
              >
                <div className="w-32 h-32 rounded-full bg-pink-50 flex items-center justify-center text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  {product.emoji}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{product.name}</h3>
                <p className="text-lg font-medium text-teal-600 mb-6">{product.price.toLocaleString('ru-RU')} ₽</p>
                <button 
                  onClick={() => addToCart(product)}
                  className="mt-auto w-full bg-pink-100 hover:bg-pink-500 text-pink-600 hover:text-white font-semibold py-3 px-6 rounded-2xl transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Cart Section */}
        <aside id="cart" className="w-full lg:w-96 shrink-0">
          <div className="bg-slate-50 rounded-3xl p-6 lg:sticky lg:top-24 border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Cart</h2>
            
            {cart.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <span className="text-4xl block mb-4 opacity-50">🛒</span>
                Your cart is empty
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto max-h-[50vh] pr-2 space-y-4 mb-6">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                      <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center text-2xl shrink-0">
                        {item.product.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-800 truncate">{item.product.name}</h4>
                        <div className="text-sm text-slate-500">
                          {item.product.price.toLocaleString('ru-RU')} ₽
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <button 
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors text-sm"
                          title="Remove item"
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
                    <span className="text-slate-600">Items:</span>
                    <span className="font-medium">{cartCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold text-slate-900">
                    <span>Total:</span>
                    <span className="text-pink-500">{cartTotal.toLocaleString('ru-RU')} ₽</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 rounded-2xl shadow-md hover:shadow-lg transition-all"
                >
                  Place Order
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
              <span className="text-xl font-bold text-white tracking-tight">Flower Paradise</span>
            </div>
            <p className="text-slate-400 text-sm">
              Delivering happiness and fresh flowers right to your doorstep.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2 text-sm">
              <li>📞 +1 (555) 123-4567</li>
              <li>✉️ hello@flowerparadise.com</li>
              <li>📍 123 Floral Street, Spring City</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Follow Us</h4>
            <div className="flex gap-4 text-xl">
              <a href="#" className="hover:text-pink-400 transition-colors"><i className="fa-brands fa-instagram"></i></a>
              <a href="#" className="hover:text-pink-400 transition-colors"><i className="fa-brands fa-facebook"></i></a>
              <a href="#" className="hover:text-pink-400 transition-colors"><i className="fa-brands fa-twitter"></i></a>
              <a href="#" className="hover:text-pink-400 transition-colors"><i className="fa-brands fa-pinterest"></i></a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-sm text-center text-slate-500">
          &copy; {new Date().getFullYear()} Flower Paradise. All rights reserved.
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
              <h3 className="text-xl font-bold text-slate-900">Checkout</h3>
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
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input required type="text" id="name" name="name" className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all" placeholder="John Doe" />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input required type="tel" id="phone" name="phone" className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all" placeholder="+1 (555) 000-0000" />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input required type="email" id="email" name="email" className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all" placeholder="john@example.com" />
                </div>
                
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">Shipping Address</label>
                  <input required type="text" id="address" name="address" className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all" placeholder="123 Main St, Apt 4B" />
                </div>
                
                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-slate-700 mb-1">Order Comment</label>
                  <textarea id="comment" name="comment" rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all resize-none" placeholder="Any special requests?"></textarea>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-slate-600 font-medium">Total to pay:</span>
                  <span className="text-2xl font-bold text-pink-500">{cartTotal.toLocaleString('ru-RU')} ₽</span>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] px-4 py-3 bg-pink-500 text-white rounded-xl font-bold shadow-md hover:bg-pink-600 hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Order'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
