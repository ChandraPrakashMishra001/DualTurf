import Link from 'next/link';
import styles from './page.module.css';

export const metadata = {
  title: 'Login | DualTurf',
};

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Login</h1>
        
        <form className={styles.form}>
          <div className={styles.formGroup}>
            <input type="email" placeholder="Email" className={styles.input} required />
          </div>
          <div className={styles.formGroup}>
            <input type="password" placeholder="Password" className={styles.input} required />
          </div>
          
          <button type="submit" className={styles.submitBtn}>Sign In</button>
        </form>
        
        <div className={styles.links}>
          <Link href="/account/register" className={styles.link}>Create account</Link>
          <Link href="#" className={styles.link}>Forgot password?</Link>
        </div>
      </div>
    </div>
  );
}
