import React, { useEffect, useState, useRef } from "react";
import { useClickOutside } from "react-haiku";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import styles from "./Modal.module.css";

function Modal({ openModal, skinToEdit, skinToEditStatus, sessionUser }) {
  const [inputNameError, setInputNameError] = useState(false);
  const [inputAuthorError, setInputAuthorError] = useState(false);
  const [inputURLError, setInputURLError] = useState(false);
  const [inputURLNot, setInputURLNot] = useState(false);
  const [inputBgURLNot, setInputBgURLNot] = useState(false);

  const [skinName, setSkinName] = useState(
    skinToEdit != null ? skinToEdit?.Name : ""
  );
  const [skinNameLength, setSkinNameLength] = useState(
    skinToEdit != null ? skinToEdit?.Name.length : 0
  );
  const [skinAuthor, setSkinAuthor] = useState(
    skinToEdit != null ? skinToEdit?.Creator : ""
  );
  const [skinAuthorLength, setSkinAuthorLength] = useState(
    skinToEdit != null ? skinToEdit?.Creator.length : 0
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
    "tournaments",
    "casual",
    "old",
    "aim",
    "stream",
    "tech",
    "reading",
    "speed",
    "highAR",
    "lowAR",
    "highCS",
    "lowCS",
    "troll",
    "NM",
    "HD",
    "HR",
    "DT",
    "EZ",
    "FL",
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

    const matchURL = skinURL.match(
      /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/
    );

    !matchURL ? setInputURLNot(true) : setInputURLNot(false);

    if (
      skinName !== "" &&
      skinNameLength <= 45 &&
      skinAuthor !== "" &&
      skinAuthorLength <= 25 &&
      skinURL !== "" &&
      matchURL &&
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
    } else {
      return;
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

  const ref = useRef(null);
  useClickOutside(ref, () => {
    openModal(false);
    skinToEditStatus();
  });

  return (
    <div className={styles.modal}>
      <div className={styles.modalMainDiv} ref={ref}>
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
              <div className={styles.complexField}>
                <input
                  type="text"
                  name="skinName"
                  id="skinName"
                  value={skinName}
                  onChange={(e) => {
                    setSkinName(e.target.value);
                    setSkinNameLength(e.target.value.length);
                  }}
                />
                <div className={styles.counter}>
                  {skinNameLength > 45 ? (
                    <div id="actualCount" style={{ color: "#ffbedc" }}>
                      {skinNameLength}
                    </div>
                  ) : (
                    <div id="actualCount">{skinNameLength}</div>
                  )}
                  <div id={styles.maxCount}>45</div>
                </div>
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="skinAuthor">
                Author *{" "}
                {inputAuthorError && (
                  <span className={styles.error}>Cannot be empty</span>
                )}
              </label>
              <div className={styles.complexField}>
                <input
                  type="text"
                  name="skinAuthor"
                  id="skinAuthor"
                  value={skinAuthor}
                  onChange={(e) => {
                    setSkinAuthor(e.target.value);
                    setSkinAuthorLength(e.target.value.length);
                  }}
                />
                <div className={styles.counter}>
                  {skinAuthorLength > 25 ? (
                    <div id="actualCount" style={{ color: "#ffbedc" }}>
                      {skinAuthorLength}
                    </div>
                  ) : (
                    <div id="actualCount">{skinAuthorLength}</div>
                  )}
                  <div id={styles.maxCount}>25</div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="skinURL">
                Download URL *{" "}
                {inputURLError && (
                  <span className={styles.error}>Cannot be empty</span>
                )}
                {inputURLNot && !inputURLError && (
                  <span className={styles.error}>Invalid URL</span>
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
              <label htmlFor="skinBgURL">
                Background Image URL{" "}
                <span className={styles.advice}>
                  &#x0028;Preferably in-game screen&#x0029;
                </span>
                {inputBgURLNot && (
                  <span className={styles.error}>Invalid URL</span>
                )}
              </label>
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
                          setAvailableTags((prev) => [...prev, tag]);
                          setSelectedTags(
                            selectedTags.filter((item) => item !== tag)
                          );
                        }}
                      >
                        {tag === "current"
                          ? "Currently Using"
                          : tag === "tournaments"
                          ? "Using in Tournaments"
                          : tag[0].toUpperCase() + tag.substring(1)}
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
                          setSelectedTags((prev) => [...prev, tag]);
                          setAvailableTags(
                            availableTags.filter((item) => item !== tag)
                          );
                        }}
                      >
                        {tag === "current"
                          ? "Currently Using"
                          : tag === "tournaments"
                          ? "Using in Tournaments"
                          : tag[0].toUpperCase() + tag.substring(1)}
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
                          setAvailableModes((prev) => [...prev, tag]);
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
                          setSelectedModes((prev) => [...prev, tag]);
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
