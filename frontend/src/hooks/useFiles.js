import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getGlobalFiles,
  getWorkspaceFiles,
  getProjectFiles,
  uploadWorkspaceFile,
  uploadProjectFile,
  deleteWorkspaceFile,
  deleteProjectFile,
} from "../services/fileService";


// ==========================================
// FILES HOOK
// ==========================================

const useFiles = ({
  scope = "global",
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


          // --------------------------------
          // GLOBAL
          // --------------------------------

          if (
            scope === "global"
          ) {

            result =
              await getGlobalFiles();

          }


          // --------------------------------
          // WORKSPACE
          // --------------------------------

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


          // --------------------------------
          // PROJECT
          // --------------------------------

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
            error.message ||
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


          // --------------------------------
          // WORKSPACE UPLOAD
          // --------------------------------

          if (
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


          // --------------------------------
          // PROJECT UPLOAD
          // --------------------------------

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


          // --------------------------------
          // GLOBAL
          // --------------------------------

          else {

            throw new Error(
              "Files can only be uploaded from a workspace or project."
            );

          }


          // --------------------------------
          // UPDATE LOCAL STATE
          // --------------------------------

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
            error.message ||
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


          // --------------------------------
          // WORKSPACE
          // --------------------------------

          if (
            scope === "workspace"
          ) {

            if (!workspaceId) {
              throw new Error(
                "Workspace ID is required."
              );
            }


            await deleteWorkspaceFile(
              workspaceId,
              fileId
            );

          }


          // --------------------------------
          // PROJECT
          // --------------------------------

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


            await deleteProjectFile(
              workspaceId,
              projectId,
              fileId
            );

          }


          // --------------------------------
          // GLOBAL
          // --------------------------------

          else {

            throw new Error(
              "Delete files from their workspace or project."
            );

          }


          // --------------------------------
          // REMOVE FROM UI
          // --------------------------------

          setFiles(
            (currentFiles) =>
              currentFiles.filter(
                (file) =>
                  String(
                    file._id ||
                    file.id
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
            error.message ||
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


  // ========================================
  // RETURN
  // ========================================

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