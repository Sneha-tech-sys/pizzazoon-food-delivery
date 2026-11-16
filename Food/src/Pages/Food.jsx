import React, { useState, useEffect } from "react";
import "../Pages/App.css";
import "../pizzaTheme.css";
import Filter from "../Components/Filter";
import { useFilterContext } from "../Contex/Filter_context";
import { useCartContext } from "../Contex/Cart_Contex";
import { NavLink } from "react-router-dom";
import Data from "../Data/Data";
import FilterButtons from "../Components/FilterButtons";
import apiClient from "../api/client";

export default function Food() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [wishlist, setWishlist] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [addedToast, setAddedToast] = useState("");
  const [copiedCode, setCopiedCode] = useState("");

  const {
    state: filterState,
    addToWishlist,
    clearFilters,
  } = useFilterContext();
  const { addToCart } = useCartContext();
  const { filters } = filterState;

  // Load products from backend with fallback
  useEffect(() => {
    const fetchBackendProducts = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get("/products/?page_size=100");
        if (res.data && res.data.data && res.data.data.items?.length > 0) {
          const mapped = res.data.data.items.map((p) => ({
            id: p.id,
            title: p.name,
            category: p.category_slug || p.category_name,
            price: parseFloat(p.price),
            rate: parseFloat(p.rating),
            img: p.image_url,
          }));
          setProductsList(mapped);
        } else {
          setProductsList(Data);
        }
      } catch (err) {
        console.warn("Backend products offline, using local catalog:", err);
        setError("Backend offline, using fallback catalog");
        setProductsList(Data);
      } finally {
        setLoading(false);
      }
    };
    fetchBackendProducts();
  }, []);

  // Filter the data by category and text
  const sourceData = productsList.length > 0 ? productsList : Data;
  const filteredData = sourceData.filter((curElm) => {
    const categoryMatch = filters.category
      ? curElm.category.toLowerCase().replace(/\s+/g, "_") ===
        filters.category.toLowerCase().replace(/\s+/g, "_")
      : true;

    const textMatch = curElm.title
      .toLowerCase()
      .includes(filters.text.toLowerCase());

    return categoryMatch && textMatch;
  });

  const handleAddToCart = async (item) => {
    const { id, title, img, price } = item;
    addToCart({
      id,
      name: title,
      image: img,
      price,
    });

    setAddedToast(`Added "${title}" to your pizza cart! 🍕`);
    setTimeout(() => setAddedToast(""), 2500);

    // Persist to backend if token present
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        await apiClient.post("/cart/items", { product_id: id, quantity: 1 });
      } catch (err) {
        console.error("Cart sync error:", err);
      }
    }
  };

  const handleAddToWishlist = async (item) => {
    const isPresent = wishlist.includes(item.id);
    const token = localStorage.getItem("access_token");

    if (isPresent) {
      setWishlist(wishlist.filter((id) => id !== item.id));
      if (token) {
        try {
          await apiClient.delete(`/wishlist/items/${item.id}`);
        } catch (e) {}
      }
    } else {
      setWishlist([...wishlist, item.id]);
      addToWishlist(item.id, item.title, item.rate, item.img, item.price);
      if (token) {
        try {
          await apiClient.post("/wishlist/items", { product_id: item.id });
        } catch (e) {}
      }
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2500);
  };

  const backgroundStyle = {
    backgroundImage: `url(${process.env.PUBLIC_URL}/Assets/bg.jpg)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    position: "relative",
    backgroundColor: "#0c0d12",
  };

  const overlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(12, 13, 18, 0.9)",
    zIndex: 0,
  };

  // Helper for dynamic appetizing pizza tags
  const getBadgeTag = (item) => {
    if (item.title.toLowerCase().includes("pizza")) return "🧀 CHEESE BURST";
    if (item.price >= 150) return "👑 CHEF SPECIAL";
    if (item.rate >= 4.5) return "⭐ BESTSELLER";
    return "🔥 FRESH & HOT";
  };

  return (
    <>
      <div style={overlayStyle}></div>
      <div style={backgroundStyle}>
        <div className="Main" style={{ position: "relative", zIndex: "5", paddingBottom: "70px" }}>
          
          {/* Toast Notification */}
          {addedToast && (
            <div
              className="pizza-pulse"
              style={{
                position: "fixed",
                bottom: "25px",
                right: "25px",
                backgroundColor: "#2ed573",
                color: "#000",
                fontWeight: "700",
                padding: "12px 20px",
                borderRadius: "8px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                zIndex: 9999,
                fontSize: "14px"
              }}
            >
              ✓ {addedToast}
            </div>
          )}

          <div className="container">
            
            {/* Page Header Banner */}
            <div className="text-center mb-4">
              <span style={{ color: "#ff9f00", fontSize: "12px", fontWeight: "800", letterSpacing: "2px", textTransform: "uppercase" }}>
                🍕 WOOD-FIRED ARTISAN PIZZAS &amp; SIDES
              </span>
              <h2 style={{ color: "#ffffff", fontFamily: '"Courgette", cursive', fontSize: "2.5rem", margin: "4px 0 8px 0" }}>
                Explore Our <span style={{ color: "#ff3838" }}>Hot Menu</span>
              </h2>
              <p style={{ color: "#a4b0be", fontSize: "14px", maxWidth: "600px", margin: "auto" }}>
                Select your favorite hand-tossed pizzas, crispy sides, and chilled beverages with real-time live order tracking!
              </p>
            </div>

            {/* Filter buttons & Search */}
            <FilterButtons />

            <div className="row mb-4 mt-2 align-items-center">
              <div className="col-lg-8 col-7">
                <Filter />
              </div>
              <div className="col-lg-2 col-5">
                <button
                  type="button"
                  className="btn w-100"
                  onClick={clearFilters}
                  style={{
                    backgroundColor: "rgba(255, 159, 0, 0.15)",
                    color: "#fffa65",
                    border: "1px solid #ff9f00",
                    fontWeight: "600",
                    padding: "8px"
                  }}
                >
                  Reset Menu
                </button>
              </div>
              <div className="col-lg-2 d-none d-lg-block text-end">
                <span style={{ color: "#a4b0be", fontSize: "13px" }}>
                  Showing: <strong style={{ color: "#ff9f00" }}>{filteredData.length}</strong> Dishes
                </span>
              </div>
            </div>

            {loading && <div className="text-center py-5 text-warning fs-5">Baking &amp; Loading Fresh Menu... 🍕</div>}
            {error && <div className="text-center text-danger py-4">{error}</div>}

            {/* Main Content Area: Products Grid (Left) + Side Advertisement Column (Right) */}
            <div className="row">
              
              {/* Product Grid Column */}
              <div className="col-lg-9 col-12">
                <div className="row g-3">
                  {!loading && filteredData.length === 0 ? (
                    <div className="text-center text-white py-5 w-100">
                      <h4>No pizzas or items found matching your filter</h4>
                      <p style={{ color: "#a4b0be" }}>Try searching for "Pizza", "Dosa", "Burger" or reset the menu filter.</p>
                      <button className="btn btn-warning mt-2" onClick={clearFilters}>View Full Menu</button>
                    </div>
                  ) : (
                    filteredData.map((curElm) => (
                      <div className="col-lg-4 col-md-6 mb-3" key={curElm.id}>
                        <div className="pizza-menu-card h-100 d-flex flex-column justify-content-between">
                          
                          {/* Card Image Wrap */}
                          <div className="pizza-card-img-wrap position-relative">
                            <span className="pizza-badge-overlay">
                              {getBadgeTag(curElm)}
                            </span>

                            {/* Wishlist Heart Icon */}
                            <button
                              onClick={() => handleAddToWishlist(curElm)}
                              style={{
                                position: "absolute",
                                top: "10px",
                                right: "10px",
                                background: wishlist.includes(curElm.id) ? "rgba(235, 47, 6, 0.85)" : "rgba(0, 0, 0, 0.65)",
                                border: "none",
                                borderRadius: "50%",
                                width: "32px",
                                height: "32px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                              title="Add to Wishlist"
                            >
                              <i
                                className="fa fa-heart"
                                style={{
                                  color: wishlist.includes(curElm.id) ? "#fff" : "#ff7675",
                                  fontSize: "14px"
                                }}
                              />
                            </button>

                            <img
                              src={process.env.PUBLIC_URL + "/" + curElm.img}
                              alt={curElm.title}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `${process.env.PUBLIC_URL}/Assets/pizza.jpeg`;
                              }}
                            />
                          </div>

                          {/* Card Body */}
                          <div className="p-3 d-flex flex-column justify-content-between flex-grow-1">
                            <div>
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span style={{ color: "#ffa801", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
                                  {curElm.category}
                                </span>
                                <span style={{ color: "#fbc531", fontSize: "12px", fontWeight: "bold" }}>
                                  ★ {curElm.rate}
                                </span>
                              </div>

                              <h5 style={{ color: "#ffffff", fontWeight: "700", fontSize: "16px", marginBottom: "6px" }}>
                                {curElm.title}
                              </h5>
                              <p style={{ color: "#a4b0be", fontSize: "12px", lineHeight: "1.4", marginBottom: "12px" }}>
                                Fresh artisan preparation made with authentic spices &amp; premium ingredients.
                              </p>
                            </div>

                            {/* Price & Action Row */}
                            <div className="d-flex justify-content-between align-items-center pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                              <div>
                                <span style={{ color: "#747d8c", fontSize: "10px", display: "block", textTransform: "uppercase" }}>Price</span>
                                <span style={{ color: "#fffa65", fontSize: "18px", fontWeight: "800" }}>
                                  ₹{curElm.price}
                                </span>
                              </div>

                              <button
                                type="button"
                                className="pizza-btn-add"
                                onClick={() => handleAddToCart(curElm)}
                                title="Add item to cart"
                              >
                                <i className="fa fa-shopping-cart" /> Add
                              </button>
                            </div>

                          </div>

                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ================= SIDE ADVERTISEMENT & PROMO COLUMN ================= */}
              <div className="col-lg-3 col-12 mt-4 mt-lg-0">
                <div style={{ position: "sticky", top: "110px" }}>
                  
                  {/* Side Ad 1: Real-World Flash Deal Banner */}
                  <div className="pizza-ad-card p-3 mb-4" style={{ borderColor: "rgba(255, 51, 68, 0.6)" }}>
                    <span className="ad-ribbon" style={{ right: "-35px", top: "10px" }}>SAVE 50%</span>
                    
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="bounce-tag" style={{ fontSize: "20px" }}>🍕</span>
                      <span style={{ color: "#ff4757", fontWeight: "800", fontSize: "11px", letterSpacing: "1px" }}>
                        TODAY'S SPONSORED DEAL
                      </span>
                    </div>

                    <h5 style={{ color: "#ffffff", fontWeight: "800", fontSize: "15px", lineHeight: "1.3" }}>
                      Weekend Pizza Binge Combo
                    </h5>
                    
                    <p style={{ color: "#dcdde1", fontSize: "12px", lineHeight: "1.4", margin: "6px 0 10px 0" }}>
                      Get any 2 Medium Pan Pizzas + 1 Free Stuffed Garlic Bread + 2 Cold Drinks!
                    </p>

                    <div className="p-2 mb-3 text-center" style={{ backgroundColor: "rgba(0,0,0,0.5)", borderRadius: "6px", border: "1px dashed #ff9f00" }}>
                      <span style={{ fontSize: "11px", color: "#a4b0be", display: "block" }}>Coupon Code</span>
                      <span
                        className="coupon-pill mt-1"
                        style={{ fontSize: "14px" }}
                        onClick={() => handleCopy("PIZZA50")}
                      >
                        {copiedCode === "PIZZA50" ? "✓ COPIED" : "🏷️ PIZZA50"}
                      </span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span style={{ color: "#747d8c", textDecoration: "line-through", fontSize: "11px" }}>₹799</span>
                        <div style={{ color: "#fffa65", fontSize: "18px", fontWeight: "800" }}>₹399</div>
                      </div>
                      <NavLink to="/cart">
                        <button className="pizza-btn-add" style={{ padding: "6px 12px", fontSize: "12px" }}>
                          Claim Deal
                        </button>
                      </NavLink>
                    </div>

                  </div>

                  {/* Side Ad 2: 20-Min Fast Delivery Guarantee Widget */}
                  <div className="pizza-feature-box p-3 mb-4 text-start">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span style={{ fontSize: "22px" }}>⚡</span>
                      <div>
                        <div style={{ color: "#ff9f00", fontWeight: "800", fontSize: "13px" }}>20-MIN EXPRESS</div>
                        <div style={{ color: "#2ed573", fontSize: "11px" }}>Store Open in Kanpur</div>
                      </div>
                    </div>
                    <p style={{ color: "#dcdde1", fontSize: "11px", lineHeight: "1.4", margin: 0 }}>
                      Every pizza is baked at 500°C and transported in insulated thermal heating bags. Steaming hot to your doorstep!
                    </p>
                  </div>

                  {/* Side Ad 3: App Download Promo */}
                  <div
                    className="p-3 text-center"
                    style={{
                      background: "linear-gradient(135deg, rgba(255, 159, 0, 0.15), rgba(255, 51, 68, 0.15))",
                      border: "1px solid rgba(255, 159, 0, 0.3)",
                      borderRadius: "12px"
                    }}
                  >
                    <span style={{ fontSize: "24px" }} className="bounce-tag">📱</span>
                    <h6 style={{ color: "#ffffff", fontWeight: "700", marginTop: "4px" }}>Order via FoodyZoon App</h6>
                    <p style={{ color: "#a4b0be", fontSize: "11px", margin: "4px 0 8px 0" }}>
                      Get a FREE Choco Lava Cake on your first mobile order!
                    </p>
                    <span style={{ color: "#fffa65", fontSize: "11px", fontWeight: "bold" }}>
                      Use Code: <strong>FREELAVA</strong>
                    </span>
                  </div>

                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </>
  );
}
