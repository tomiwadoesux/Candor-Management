import Link from "next/link";
import LogoAnimation from "./LogoAnimation";
import styles from "./MobileBoardLogo.module.css";

export default function MobileBoardLogo() {
  return (
    <div className={styles.brand}>
      <Link href="/" aria-label="Candor home" className={styles.homeLink}>
        <LogoAnimation animate={false} tight className={styles.logo} />
      </Link>
    </div>
  );
}
