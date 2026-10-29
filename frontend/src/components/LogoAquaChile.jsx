// Logo oficial (PNG transparente servido desde /public).
// `sobreOscuro` lo pinta en blanco para fondos oscuros, como la cabecera.
const ALTURAS = { small: 'h-8', medium: 'h-11', large: 'h-16' };

const LogoAquaChile = ({ size = 'medium', sobreOscuro = false }) => (
  <img
    src="/logo-aquachile.png"
    alt="AquaChile"
    className={`${ALTURAS[size] ?? ALTURAS.medium} w-auto max-w-full object-contain select-none ${
      sobreOscuro ? 'brightness-0 invert' : ''
    }`}
  />
);

export default LogoAquaChile;
