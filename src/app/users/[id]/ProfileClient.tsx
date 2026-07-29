"use client";

import jsDownload from "js-file-download";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Modal from "@/components/Modal/Modal";
import ProfileBigCover from "@/components/ProfileBigCover/ProfileBigCover";
import ProfileSidePanel from "@/components/ProfileSidePanel/ProfileSidePanel";
import {
  normalizeProfileLayout,
  type ProfileLayoutProps,
} from "@/lib/profileLayout";
import { deleteSkin, incrementDownload } from "./actions";

interface ProfileClientProps {
  userData: any;
  skinsData: any[];
  isOwner: boolean;
  sessionId: string | null;
}

// Owns profile state and mutations; the chosen layout only decides how it looks.
export default function ProfileClient({
  userData,
  skinsData,
  isOwner,
  sessionId,
}: ProfileClientProps) {
  const router = useRouter();

  const [skinView, setSkinView] = useState<"list" | "grid">(
    userData.skin_view?.value === "list" ? "list" : "grid"
  );
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalSkinEdit, setModalSkinEdit] = useState<any>();

  function handleDownload(skin: any) {
    void incrementDownload(skin.id);
    window.open(skin.URL, "_blank");
  }

  async function handleDelete(id: any) {
    const res = await deleteSkin(id);
    if (res.status === "done") router.refresh();
  }

  function openEdit(skin: any) {
    setModalSkinEdit(skin);
    setModalIsOpen(true);
  }

  function openAdd() {
    setModalSkinEdit(undefined);
    setModalIsOpen(true);
  }

  function downloadTabletSettings() {
    jsDownload(
      JSON.stringify(userData.tabletSettingsFile),
      userData.tabletFileUploadInfo.file
    );
  }

  const layoutProps: ProfileLayoutProps = {
    userData,
    skinsData,
    isOwner,
    sessionId,
    skinView,
    setSkinView,
    shareUrl: (skinId: any) =>
      `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/users/${userData.id}#${skinId}`,
    onAddSkin: openAdd,
    onEditSkin: openEdit,
    onDeleteSkin: handleDelete,
    onDownloadSkin: handleDownload,
    onDownloadTabletSettings: downloadTabletSettings,
  };

  const layout = normalizeProfileLayout(userData.profile_layout);

  return (
    <>
      {layout === "big-cover" ? (
        <ProfileBigCover {...layoutProps} />
      ) : (
        <ProfileSidePanel {...layoutProps} />
      )}

      {modalIsOpen && (
        <Modal
          openModal={setModalIsOpen}
          skinToEdit={modalSkinEdit}
          skinToEditStatus={setModalSkinEdit}
          sessionUser={sessionId}
        />
      )}
    </>
  );
}
