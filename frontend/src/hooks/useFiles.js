import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getOrganizationFiles,
  getWorkspaceFiles,
  getProjectFiles,
  uploadOrganizationFile,
  uploadWorkspaceFile,
  uploadProjectFile,
  deleteWorkspaceFile,
  deleteProjectFile,
} from "../services/fileService";


// ==========================================
// FILES HOOK
// ==========================================

const useFiles = ({
  scope = "organization",
  workspaceId = null,
  projectId = null,
} = {}) => {

  const [files, setFiles] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState("");


  // ========================================
  // LOAD FILES
  // ========================================

  const loadFiles =
    useCallback(
      async () => {

        try {

          setLoading(true);
          setError("");

          let result = [];

          // ==================================
          // ORGANIZATION / GLOBAL
          // ==================================

          if (
            scope === "organization" ||
            scope === "global"
          ) {

            const organizationId =
              localStorage.getItem(
                "currentOrganizationId"
              );

            if (!organizationId) {
              throw new Error(
                "Please select an organization."
              );
            }

            result =
              await getOrganizationFiles(
                organizationId
              );
          }

          // ==================================
          // WORKSPACE
          // ==================================

          else if (
            scope === "workspace"
          ) {

            if (!workspaceId) {
              throw new Error(
                "Workspace ID is required."
              );
            }

            result =
              await getWorkspaceFiles(
                workspaceId
              );
          }

          // ==================================
          // PROJECT
          // ==================================

          else if (
            scope === "project"
          ) {

            if (
              !workspaceId ||
              !projectId
            ) {
              throw new Error(
                "Workspace ID and Project ID are required."
              );
            }

            result =
              await getProjectFiles(
                workspaceId,
                projectId
              );
          }

          setFiles(
            Array.isArray(result)
              ? result
              : []
          );

        } catch (error) {

          console.error(
            "Load files error:",
            error
          );

          setError(
            error?.message ||
              "Unable to load files."
          );

          setFiles([]);

        } finally {

          setLoading(false);

        }

      },
      [
        scope,
        workspaceId,
        projectId,
      ]
    );


  // ========================================
  // INITIAL LOAD
  // ========================================

  useEffect(() => {

    loadFiles();

  }, [
    loadFiles,
  ]);


  // ========================================
  // ORGANIZATION CHANGED
  // ========================================

  useEffect(() => {

    const handleOrganizationChanged =
      () => {

        setFiles([]);
        setError("");

        loadFiles();

      };

    window.addEventListener(
      "organizationChanged",
      handleOrganizationChanged
    );

    return () => {

      window.removeEventListener(
        "organizationChanged",
        handleOrganizationChanged
      );

    };

  }, [
    loadFiles,
  ]);


  // ========================================
  // UPLOAD FILE
  // ========================================

  const uploadFile =
    useCallback(
      async (file) => {

        if (!file) {
          throw new Error(
            "Please select a file."
          );
        }

        try {

          setUploading(true);
          setError("");

          let uploadedFile;

          // ==================================
          // ORGANIZATION
          // ==================================

          if (
            scope === "organization" ||
            scope === "global"
          ) {

            const organizationId =
              localStorage.getItem(
                "currentOrganizationId"
              );

            if (!organizationId) {
              throw new Error(
                "Please select an organization."
              );
            }

            uploadedFile =
              await uploadOrganizationFile(
                organizationId,
                file
              );
          }

          // ==================================
          // WORKSPACE
          // ==================================

          else if (
            scope === "workspace"
          ) {

            if (!workspaceId) {
              throw new Error(
                "Workspace ID is required."
              );
            }

            uploadedFile =
              await uploadWorkspaceFile(
                workspaceId,
                file
              );
          }

          // ==================================
          // PROJECT
          // ==================================

          else if (
            scope === "project"
          ) {

            if (
              !workspaceId ||
              !projectId
            ) {
              throw new Error(
                "Workspace ID and Project ID are required."
              );
            }

            uploadedFile =
              await uploadProjectFile(
                workspaceId,
                projectId,
                file
              );
          }

          // ==================================
          // UPDATE UI
          // ==================================

          if (uploadedFile) {

            setFiles(
              (currentFiles) => [
                uploadedFile,
                ...currentFiles,
              ]
            );

          }

          return uploadedFile;

        } catch (error) {

          console.error(
            "Upload file error:",
            error
          );

          setError(
            error?.message ||
              "Unable to upload file."
          );

          throw error;

        } finally {

          setUploading(false);

        }

      },
      [
        scope,
        workspaceId,
        projectId,
      ]
    );


  // ========================================
  // DELETE FILE
  // ========================================

  const deleteFile =
    useCallback(
      async (fileId) => {

        if (!fileId) {
          throw new Error(
            "File ID is required."
          );
        }

        try {

          setDeleting(true);
          setError("");

          if (
            scope === "workspace"
          ) {

            await deleteWorkspaceFile(
              workspaceId,
              fileId
            );

          } else if (
            scope === "project"
          ) {

            await deleteProjectFile(
              workspaceId,
              projectId,
              fileId
            );

          } else {

            throw new Error(
              "Organization files cannot be deleted from this page."
            );

          }

          setFiles(
            (currentFiles) =>
              currentFiles.filter(
                (file) =>
                  String(
                    file?._id ||
                      file?.id
                  ) !==
                  String(fileId)
              )
          );

        } catch (error) {

          console.error(
            "Delete file error:",
            error
          );

          setError(
            error?.message ||
              "Unable to delete file."
          );

          throw error;

        } finally {

          setDeleting(false);

        }

      },
      [
        scope,
        workspaceId,
        projectId,
      ]
    );


  return {
    files,
    loading,
    uploading,
    deleting,
    error,
    refresh:
      loadFiles,
    uploadFile,
    deleteFile,
  };
};


export default useFiles;