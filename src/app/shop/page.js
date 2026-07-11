'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Search, Filter, MessageCircle, ChevronRight, Loader2 } from 'lucide-react';
import { getStoreCatalog, logProductEnquiry } from '@/actions/storefront';

export default function StorefrontPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);
  
  // Replace with actual business WhatsApp number
  const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '254704003710';

  useEffect(() => {
    async function loadCatalog() {
      try {
        const data = await getStoreCatalog();
        setProducts(data);
        
        // Extract unique categories
        const cats = new Set(data.map(p => p.CATEGORY_NAME));
        setCategories(['All', ...Array.from(cats)]);
      } catch (error) {
        console.error('Failed to load catalog', error);
      }
      setLoading(false);
    }
    loadCatalog();
  }, []);

  const handleEnquire = async (product) => {
    // 1. Log the enquiry in the background
    await logProductEnquiry(product.PRODUCT_ID);
    
    // 2. Format the message
    const message = `Hello Ephrad Enterprises, I am interested in the ${product.BRAND || ''} ${product.NAME} (Model: ${product.MODEL || 'N/A'}). Is it still available at KSh ${product.PRICE?.toLocaleString() || 'TBD'}?`;
    
    // 3. Redirect to WhatsApp
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.NAME?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.MODEL?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.BRAND?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.CATEGORY_NAME === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      {/* Navbar */}
      <nav className="glass" style={{ position: 'sticky', top: 0, zIndex: 50, padding: '1rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/logo.png" alt="Ephrad Enterprises Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, background: 'linear-gradient(135deg, var(--foreground), var(--muted-foreground))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Ephrad Enterprises
          </h1>
        </div>
        
        <div className="hidden md:flex" style={{ display: 'flex', position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input 
            type="text"
            placeholder="Search laptops, desktops..."
            className="input"
            style={{ paddingLeft: '2.5rem', width: '100%', borderRadius: '20px', background: 'rgba(255,255,255,0.05)' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{ padding: '4rem 2rem', textAlign: 'center', background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)' }}>
        <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.2 }}>
          Premium Tech, <br />
          <span style={{ color: 'var(--primary)' }}>Delivered to You.</span>
        </h2>
        <p style={{ fontSize: '1.125rem', color: 'var(--muted-foreground)', maxWidth: '600px', margin: '0 auto 2rem' }}>
          Browse our curated selection of high-performance laptops and accessories. Enquire instantly via WhatsApp for the best deals.
        </p>
      </header>

      {/* Main Content */}
      <main style={{ padding: '0 2rem 4rem', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Categories */}
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '2rem', scrollbarWidth: 'none' }}>
          <Filter size={20} style={{ color: 'var(--muted-foreground)', flexShrink: 0, marginTop: '10px' }} />
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '20px',
                whiteSpace: 'nowrap',
                fontWeight: 500,
                transition: 'all 0.2s',
                background: activeCategory === cat ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: activeCategory === cat ? 'white' : 'var(--muted-foreground)',
                border: '1px solid',
                borderColor: activeCategory === cat ? 'var(--primary)' : 'var(--border)',
                cursor: 'pointer'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted-foreground)' }}>
            No products found matching your criteria.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
            {filteredProducts.map(product => (
              <div 
                key={product.PRODUCT_ID}
                className="glass animate-fade-in product-card"
                style={{ 
                  borderRadius: '16px', 
                  overflow: 'hidden', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  cursor: 'pointer'
                }}
              >
                <div style={{ height: '220px', background: 'rgba(255,255,255,0.02)', position: 'relative' }}>
                  {product.IMAGE_URL ? (
                    <img 
                      src={product.IMAGE_URL} 
                      alt={product.NAME} 
                      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '1rem' }} 
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80'; }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)' }}>
                      No Image
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>
                    {product.CATEGORY_NAME}
                  </div>
                </div>
                
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <div style={{ color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>{product.BRAND}</div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: 700, lineHeight: 1.3 }}>{product.NAME}</h3>
                  {product.MODEL && <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>Model: {product.MODEL}</div>}
                  
                  <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                      KSh {product.PRICE?.toLocaleString() || 'N/A'}
                    </div>
                    
                    <button 
                      onClick={() => handleEnquire(product)}
                      className="btn" 
                      style={{ 
                        background: '#25D366', 
                        color: 'white', 
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(37, 211, 102, 0.2)'
                      }}
                    >
                      <MessageCircle size={16} fill="white" />
                      Enquire
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      <footer style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)', borderTop: '1px solid var(--border)' }}>
        <p>&copy; {new Date().getFullYear()} Ephrad Enterprises Limited. All rights reserved.</p>
      </footer>
    </div>
  );
}
