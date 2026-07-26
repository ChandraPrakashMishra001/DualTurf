import Link from 'next/link';
import styles from './page.module.css';

export const metadata = {
  title: 'Register | DualTurf',
};

export default function RegisterPage() {
  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Create Account</h1>
        
        <form className={styles.form}>
          <div className={styles.formGroup}>
            <input type="text" placeholder="First Name" className={styles.input} required />
          </div>
          <div className={styles.formGroup}>
            <input type="text" placeholder="Last Name" className={styles.input} required />
          </div>
          <div className={styles.formGroup}>
            <input type="email" placeholder="Email" className={styles.input} required />
          </div>
          <div className={styles.formGroup}>
            <input type="password" placeholder="Password" className={styles.input} required />
          </div>
          
          <button type="submit" className={styles.submitBtn}>Create</button>
        </form>
        
        <div className={styles.links}>
          <Link href="/account/login" className={styles.link}>Already have an account? Sign In</Link>
        </div>
      </div>
    </div>
  );
}
