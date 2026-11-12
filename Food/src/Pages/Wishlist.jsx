import React from "react";
import { useFilterContext } from "../Contex/Filter_context";
import { NavLink } from "react-router-dom";
import { useCartContext } from "../Contex/Cart_Contex";
import apiClient from "../api/client";
import "../pizzaTheme.css";

export default function Wishlist() {
  const { state, removeItem } = useFilterContext();
  const { wishlist } = state;
  const { addToCart } = useCartContext();

  const handleAddToCart = async (item) => {
    addToCart({
      id: item.id,
      name: item.name || item.title,
      image: item.image || item.img,
      price: item.price,
    });
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        await apiClient.post("/cart/items", { product_id: item.id, quantity: 1 });
      } catch (e) {}
    }
  };

  const handleRemove = async (id) => {
    removeItem(id);
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        await apiClient.delete(`/wishlist/items/${id}`);
      } catch (e) {}
    }
  };

  const backgroundStyle = {
    backgroundImage: `url(${process.env.PUBLIC_URL}/Assets/bg.jpg)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    height: "auto",
    minHeight: "100vh",
    position: "relative",
  };

  const overlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    zIndex: 0,
  };

  return (
    <div style={backgroundStyle}>
      <div style={overlayStyle}></div>
      <div className="Main" style={{ paddingBottom: "60px" }}>
        <div className="container p-5">
          <div className="row mb-3">
            <div className="col-lg-2"></div>
            <div className="col-lg-8">
              <h2
                className="text-center text-white"
                style={{ position: "relative", zIndex: "5", fontFamily: "Courgette, cursive", color: "orange" }}
              >
                My Wishlist
              </h2>
            </div>
            <div className="col-lg-2"></div>
          </div>

          <div className="row" style={{ position: "relative", zIndex: "5" }}>
            {wishlist.length === 0 ? (
              <p className="text-center text-white py-5">Your wishlist is currently empty.</p>
            ) : (
              wishlist.map((item) => (
                <div className="col-lg-4 mb-3" key={item.id}>
                  <div
                    className="card text-left mb-2 shadow-lg"
                    style={{
                      backgroundColor: "rgba(25, 25, 25, 0.75)",
                      border: "1px solid white",
                    }}
                  >
                    <div className="row">
                      <div className="col-lg-6 col-6">
                        <img
                          src={process.env.PUBLIC_URL + "/" + (item.image || item.img)}
                          className="card-img-top"
                          alt={item.name}
                          style={{ height: "18vh", objectFit: "cover" }}
                        />
                      </div>
                      <div className="col-lg-6 col-6">
                        <p
                          className="card-title pt-2"
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            textAlign: "left",
                            color: "orange",
                          }}
                        >
                          {item.name}
                        </p>
                        <div className="pt-1">
                          <div className="d-flex align-items-center" style={{ marginTop: "3px" }}>
                            <h6 id="rate" style={{ color: "white", margin: 0 }}>
                              <i
                                className="fa fa-star"
                                aria-hidden="true"
                                style={{ color: "orange" }}
                              ></i>
                              &nbsp;{item.rating || "4.5"}
                            </h6>
                            {item.price && (
                              <span style={{ fontSize: "13px", color: "lightgray", marginLeft: "12px" }}>
                                ₹{item.price}
                              </span>
                            )}
                          </div>
                          <div className="d-flex justify-content-around mt-3">
                            <NavLink to="/cart">
                              <button
                                type="button"
                                className="btn"
                                style={{
                                  backgroundColor: "orange",
                                  fontSize: "13px",
                                }}
                                onClick={() => handleAddToCart(item)}
                              >
                                <i
                                  className="fa fa-shopping-cart"
                                  aria-hidden="true"
                                ></i>
                              </button>
                            </NavLink>
                            <button
                              onClick={() => handleRemove(item.id)}
                              style={{
                                backgroundColor: "transparent",
                                border: "none",
                                fontSize: "20px",
                                marginTop: "-5px",
                                width: "auto",
                                cursor: "pointer",
                              }}
                            >
                              <i
                                className="fa fa-trash"
                                aria-hidden="true"
                                style={{ color: "orange" }}
                              ></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
