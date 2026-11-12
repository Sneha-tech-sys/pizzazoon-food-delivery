import React from "react";
import { useCartContext } from "../Contex/Cart_Contex";
import "../Components/Slider.css";

export default function CartItem({
  id,
  name,
  image,
  price,
  quantity,
  removeItem,
}) {
  const { increaseQuantity, decreaseQuantity } = useCartContext();

  const totalPrice = price * quantity;
  const imageSrc =
    !image
      ? `${process.env.PUBLIC_URL}/Assets/food.avif`
      : image.startsWith("http") || image.startsWith("/")
      ? image
      : `${process.env.PUBLIC_URL}/${image}`;

  return (
    <>
      <div className="row mb-3 align-items-center" id="cart-item">
        <div className="col-lg-2 col-2">
          <img className="cart-img" src={imageSrc} alt={name} style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px" }} />
        </div>

        <div className="col-lg-2 col-2">
          <h6 className="cart-name" style={{ color: "orange" }}>{name}</h6>
        </div>

        <div className="col-lg-2 col-3 d-flex justify-content-center align-items-center">
          <button
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: "white",
              cursor: "pointer",
              padding: "4px 8px",
            }}
            onClick={() => decreaseQuantity(id)}
            className="cart-btn"
          >
            <i className="fa fa-minus" id="icon" />
          </button>
          <span className="cart-quantity mx-2" style={{ fontWeight: "bold" }}>{quantity}</span>
          <button
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: "white",
              cursor: "pointer",
              padding: "4px 8px",
            }}
            onClick={() => increaseQuantity(id)}
            className="cart-btn"
          >
            <i className="fa fa-plus" id="icon" />
          </button>
        </div>

        <div className="col-lg-2 col-2">
          <p className="cart-price mb-0">₹{totalPrice.toFixed(2)}</p>
        </div>

        <div className="col-lg-1 col-2 d-flex justify-content-end">
          <button
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: "orange",
              cursor: "pointer",
              width: "auto",
            }}
            onClick={() => removeItem(id)}
            className="cart-remove-btn"
          >
            <i className="fa fa-trash" id="trash" />
          </button>
        </div>
      </div>
    </>
  );
}
