import React from "react";
import styles from "./AlertContainer.module.css";

const alertType = {
  skinLink: "Link Copied!",
  discordID: "Username Copied!",
  secret_key: "Secret Key Copied!",
};

function AlertContainer({ type }) {
  return <div className={styles.alertContainer}>{alertType[type]}</div>;
}

export default AlertContainer;
