import React from "react";
import { Navigation1 } from "../components/Navigation/Navigation1";
import { Page1 } from "../components/Page1/Page1";
import { Footer } from "../components/Footer/Footer";
import styles from "./HomePage.module.css";


export default function HomePage() {
  return (
    <main className={styles.homepage}>
      <div className={styles.container}>
        <Navigation1 />
        <Page1 />
        <Footer />       
      </div>
    </main>
  );
}

