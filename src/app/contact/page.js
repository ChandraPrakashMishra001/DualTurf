import styles from './page.module.css';

export const metadata = {
  title: 'Contact Us | DualTurf',
  description: 'Get in touch with the DualTurf team.',
};

export default function ContactPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Contact Us</h1>
        <p className={styles.subtitle}>We'd love to hear from you. Our team is here to help.</p>
      </div>

      <div className={styles.layout}>
        <div className={styles.formSection}>
          <form className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Name</label>
              <input type="text" id="name" placeholder="Your name" />
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <input type="email" id="email" placeholder="Your email address" />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="phone">Phone Number</label>
                <input type="tel" id="phone" placeholder="Your phone number" />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="message">Comment</label>
              <textarea id="message" rows="6" placeholder="How can we help you?"></textarea>
            </div>
            
            <button type="button" className={styles.submitBtn}>Submit</button>
          </form>
        </div>

        <div className={styles.infoSection}>
          <div className={styles.infoCard}>
            <h3>Email</h3>
            <p>support@dualturf.in</p>
          </div>
          
          <div className={styles.infoCard}>
            <h3>Location</h3>
            <p>Mumbai, MH</p>
            <p>India</p>
          </div>
          
          <div className={styles.infoCard}>
            <h3>Follow us</h3>
            <a href="#" className={styles.socialLink}>Instagram</a>
            <a href="#" className={styles.socialLink}>Twitter / X</a>
            <a href="#" className={styles.socialLink}>Facebook</a>
          </div>
        </div>
      </div>
    </div>
  );
}
