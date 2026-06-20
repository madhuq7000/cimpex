import { FaWhatsapp } from "react-icons/fa";

export default function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/919999999999"
      target="_blank"
      rel="noreferrer"
      className="position-fixed"
      style={{
        bottom: "20px",
        right: "20px",
        zIndex: 999,
      }}
    >
      <div
        className="bg-success text-white rounded-circle d-flex justify-content-center align-items-center shadow"
        style={{
          width: "60px",
          height: "60px",
          fontSize: "30px",
        }}
      >
        <FaWhatsapp />
      </div>
    </a>
  );
}
