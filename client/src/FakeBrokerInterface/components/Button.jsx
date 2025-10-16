function Button ({ label }) {
  return (
    <button onMouseOver={() => console.log(`Hovered over ${label} button`)}>
      {label}
    </button>
  );
}

export default Button;