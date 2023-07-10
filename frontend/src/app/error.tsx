'use client';

import styles from "./NotFound.module.scss";

const NotFound = () => {
  return (
    <div className={styles.wrapper}>
      <h2 className={styles.text}>An error has occurred</h2>
    </div>
  );
};

export default NotFound;
