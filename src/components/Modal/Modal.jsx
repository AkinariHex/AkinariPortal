import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import styles from "./Modal.module.css";

function Modal({ openModal, skinToEdit, skinToEditStatus, sessionUser }) {
  const [inputNameError, setInputNameError] = useState(false);
  const [inputAuthorError, setInputAuthorError] = useState(false);
  const [inputURLError, setInputURLError] = useState(false);

  const [skinName, setSkinName] = useState(
    skinToEdit != null ? skinToEdit?.Name : ""
  );
  const [skinAuthor, setSkinAuthor] = useState(
    skinToEdit != null ? skinToEdit?.Creator : ""
  );
  const [skinURL, setSkinURL] = useState(
    skinToEdit != null ? skinToEdit?.URL : ""
  );
  const [skinBgURL, setSkinBgURL] = useState(
    skinToEdit != null ? skinToEdit?.Banner : ""
  );

  const [selectedTags, setSelectedTags] = useState(
    skinToEdit != null ? skinToEdit?.Tags : []
  );
  const [availableTags, setAvailableTags] = useState([
    "current",
    "HD",
    "HR",
    "DT",
    "EZ",
  ]);

  const [selectedModes, setSelectedModes] = useState(
    skinToEdit != null ? skinToEdit?.Modes : []
  );
  const [availableModes, setAvailableModes] = useState([
    "osu!standard",
    "osu!mania",
    "osu!taiko",
    "osu!ctb",
  ]);

  async function postSkinToDB() {
    skinName === "" ? setInputNameError(true) : setInputNameError(false);
    skinAuthor === "" ? setInputAuthorError(true) : setInputAuthorError(false);
    skinURL === "" ? setInputURLError(true) : setInputURLError(false);

    if (
      !inputNameError &&
      !inputAuthorError &&
      !inputURLError &&
      selectedModes !== []
    ) {
      var values = {
        name: skinName,
        creator: skinAuthor,
        owner: sessionUser.toString(),
        bg: skinBgURL,
        modes: JSON.stringify(selectedModes),
        tags: JSON.stringify(selectedTags.sort()),
        url: skinURL,
        recordID: skinToEdit != null ? skinToEdit.RecordID : "",
      };

      let submit = await fetch(
        `/api/skins/${skinToEdit != null ? "update" : "create"}`,
        {
          method: "POST",
          headers: new Headers({
            Accept: "application/json",
            "Content-Type": "application/json",
          }),
          body: JSON.stringify(values),
        }
      );
      submit = await submit.json();

      submit.status === "done" && window.location.reload();
    }
  }

  useEffect(() => {
    if (skinToEdit != null) {
      skinToEdit?.Tags.forEach((tag) => {
        setAvailableTags((prev) => prev.filter((item) => item !== tag));
      });
      skinToEdit?.Modes.forEach((tag) => {
        setAvailableModes((prev) => prev.filter((item) => item !== tag));
      });
    }
  }, []);

  return (
    <div className={styles.modal}>
      <div className={styles.modalMainDiv}>
        <div className={styles.modalHeader}>
          <span>{skinToEdit != null ? "Edit skin" : "Add a new skin"}</span>
          <FontAwesomeIcon
            icon={faXmark}
            style={{ cursor: "pointer" }}
            onClick={() => {
              openModal(false);
              skinToEditStatus();
            }}
          />
        </div>
        <div className={styles.modalContent}>
          {/* <div className={styles.modalSkinIniFileInput}>
            <input
              type="file"
              name="skinINIfile"
              id="skinINIfile"
              onChange={(e) => getFile(e.target)}
            />
            <span>Select your skin.ini file from your Skin Folder</span>
            <div className="button"></div>
          </div> */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="skinName">
                Name *{" "}
                {inputNameError && (
                  <span className={styles.error}>Cannot be empty</span>
                )}
              </label>
              <input
                type="text"
                name="skinName"
                id="skinName"
                value={skinName}
                onChange={(e) => setSkinName(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="skinAuthor">
                Author *{" "}
                {inputAuthorError && (
                  <span className={styles.error}>Cannot be empty</span>
                )}
              </label>
              <input
                type="text"
                name="skinAuthor"
                id="skinAuthor"
                value={skinAuthor}
                onChange={(e) => setSkinAuthor(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="skinURL">
                Download URL *{" "}
                {inputURLError && (
                  <span className={styles.error}>Cannot be empty</span>
                )}
              </label>
              <input
                type="url"
                name="skinURL"
                id="skinURL"
                value={skinURL}
                onChange={(e) => setSkinURL(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="skinBgURL">Background Image URL</label>
              <input
                type="url"
                name="skinBgURL"
                id="skinBgURL"
                value={skinBgURL}
                onChange={(e) => setSkinBgURL(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="skinTags">
                Tags{" "}
                <span className={styles.advice}>
                  &#x0028;Make sure to use &#x0022;Currently Using&#x0022; tag
                  only with one skin&#x0029;
                </span>{" "}
              </label>
              <div className={styles.tagsSelection}>
                <div id={styles.skinTags} name="skinTags">
                  {selectedTags.map((tag) => {
                    return (
                      <div
                        className={`tag ${tag}`}
                        style={{
                          display: "flex",
                          flexFlow: "row",
                          gap: "8px",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          setAvailableTags((prev) => [...prev, tag].sort());
                          setSelectedTags(
                            selectedTags.filter((item) => item !== tag)
                          );
                        }}
                      >
                        {tag === "current" ? "Currently Using" : tag}
                        <FontAwesomeIcon icon={faXmark} />
                      </div>
                    );
                  })}
                </div>
                <div className={styles.tagsCollection}>
                  {availableTags.map((tag) => {
                    return (
                      <div
                        className={`tag ${tag}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setSelectedTags((prev) => [...prev, tag].sort());
                          setAvailableTags(
                            availableTags.filter((item) => item !== tag)
                          );
                        }}
                      >
                        {tag === "current" ? "Currently Using" : tag}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="skinModes">Modes *</label>
              <div className={styles.modesSelection}>
                <div id={styles.modesTags} name="skinModes">
                  {selectedModes.map((tag) => {
                    return (
                      <div
                        className={`tag skinMode`}
                        style={{ cursor: "pointer", gap: "5px" }}
                        onClick={() => {
                          setAvailableModes((prev) => [...prev, tag].sort());
                          setSelectedModes(
                            selectedModes.filter((item) => item !== tag)
                          );
                        }}
                      >
                        {tag === "osu!standard" && (
                          <img
                            className={`skinMode active`}
                            style={{ width: "18px" }}
                            src="/img/modes/mode-osu.png"
                          />
                        )}
                        {tag === "osu!mania" && (
                          <img
                            className={`skinMode active`}
                            style={{ width: "18px" }}
                            src="/img/modes/mode-mania.png"
                          />
                        )}
                        {tag === "osu!taiko" && (
                          <img
                            className={`skinMode active`}
                            style={{ width: "18px" }}
                            src="/img/modes/mode-taiko.png"
                          />
                        )}
                        {tag === "osu!ctb" && (
                          <img
                            className={`skinMode active`}
                            style={{ width: "18px", rotate: "-90deg" }}
                            src="/img/modes/mode-fruits.png"
                          />
                        )}
                        {tag}
                        <FontAwesomeIcon icon={faXmark} />
                      </div>
                    );
                  })}
                </div>
                <div className={styles.modesCollection}>
                  {availableModes.map((tag) => {
                    return (
                      <div
                        className={`tag skinMode`}
                        style={{ cursor: "pointer", gap: "5px" }}
                        onClick={() => {
                          setSelectedModes((prev) => [...prev, tag].sort());
                          setAvailableModes(
                            availableModes.filter((item) => item !== tag)
                          );
                        }}
                      >
                        {tag === "osu!standard" && (
                          <img
                            className={`skinMode active`}
                            style={{ width: "18px" }}
                            src="/img/modes/mode-osu.png"
                          />
                        )}
                        {tag === "osu!mania" && (
                          <img
                            className={`skinMode active`}
                            style={{ width: "18px" }}
                            src="/img/modes/mode-mania.png"
                          />
                        )}
                        {tag === "osu!taiko" && (
                          <img
                            className={`skinMode active`}
                            style={{ width: "18px" }}
                            src="/img/modes/mode-taiko.png"
                          />
                        )}
                        {tag === "osu!ctb" && (
                          <img
                            className={`skinMode active`}
                            style={{ width: "18px", rotate: "-90deg" }}
                            src="/img/modes/mode-fruits.png"
                          />
                        )}
                        {tag}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className={styles.submitBTN} onClick={postSkinToDB}>
            Submit
          </div>
        </div>
      </div>
    </div>
  );
}

export default Modal;
