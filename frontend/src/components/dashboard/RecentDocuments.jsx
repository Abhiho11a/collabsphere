import {
  FileText,
  File,
  FileSpreadsheet,
  FileImage,
  FileCode2,
  ArrowRight,
} from "lucide-react";

import { useNavigate } from "react-router-dom";


// =====================================================
// HELPERS
// =====================================================

const getDocumentIcon = (document) => {
  const type =
    document?.mimeType ||
    document?.fileType ||
    document?.type ||
    "";

  const name =
    document?.name ||
    document?.title ||
    "";


  const value =
    `${type} ${name}`.toLowerCase();


  if (
    value.includes("pdf")
  ) {
    return FileText;
  }


  if (
    value.includes("spreadsheet") ||
    value.includes("excel") ||
    value.includes(".xlsx") ||
    value.includes(".xls")
  ) {
    return FileSpreadsheet;
  }


  if (
    value.includes("image") ||
    value.includes(".png") ||
    value.includes(".jpg") ||
    value.includes(".jpeg") ||
    value.includes(".webp")
  ) {
    return FileImage;
  }


  if (
    value.includes("javascript") ||
    value.includes("typescript") ||
    value.includes("json") ||
    value.includes("code") ||
    value.includes(".js") ||
    value.includes(".jsx") ||
    value.includes(".ts") ||
    value.includes(".tsx")
  ) {
    return FileCode2;
  }


  return File;
};


// =====================================================
// DATE FORMATTER
// =====================================================

const formatDate = (date) => {
  if (!date) {
    return "Unknown date";
  }


  const parsedDate =
    new Date(date);


  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "Unknown date";
  }


  return parsedDate.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
};


// =====================================================
// COMPONENT
// =====================================================

const RecentDocuments = ({
  documents = [],
}) => {

  const navigate =
    useNavigate();


  // ===================================================
  // EMPTY STATE
  // ===================================================

  if (!documents.length) {

    return (
      <section className="rounded-xl border border-slate-800 bg-slate-900/40">

        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">

          <div>

            <h2 className="text-sm font-semibold text-slate-100">
              Recent documents
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Recently updated workspace documents
            </p>

          </div>


          <FileText
            size={18}
            className="text-slate-600"
          />

        </div>


        {/* EMPTY */}

        <div className="flex min-h-[220px] flex-col items-center justify-center px-5 text-center">

          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900">

            <FileText
              size={18}
              className="text-slate-600"
            />

          </div>


          <p className="mt-3 text-sm font-medium text-slate-300">
            No documents yet
          </p>


          <p className="mt-1 text-xs text-slate-500">
            Recently created documents will appear here.
          </p>

        </div>

      </section>
    );
  }


  // ===================================================
  // DOCUMENT LIST
  // ===================================================

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/40">

      {/* HEADER */}

      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">

        <div>

          <h2 className="text-sm font-semibold text-slate-100">
            Recent documents
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Recently updated workspace documents
          </p>

        </div>


        <FileText
          size={18}
          className="text-slate-600"
        />

      </div>


      {/* DOCUMENTS */}

      <div className="divide-y divide-slate-800">

        {documents.map(
          (document, index) => {

            const documentId =
              document?._id ||
              document?.id ||
              `${index}`;


            const title =
              document?.title ||
              document?.name ||
              "Untitled document";


            const Icon =
              getDocumentIcon(
                document
              );


            const updatedAt =
              document?.updatedAt ||
              document?.createdAt;


            const workspaceId =
              document?.workspaceId ||
              document?.workspace?._id ||
              document?.workspace?.id;


            const handleOpen = () => {

              if (documentId) {

                /*
                  If your document editor is a global route,
                  this will open:

                  /documents/:documentId
                */

                navigate(
                  `/documents/${documentId}`
                );

              }

            };


            return (
              <button
                key={documentId}
                type="button"
                onClick={handleOpen}
                className="group flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-900/70"
              >

                {/* ICON */}

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">

                  <Icon
                    size={16}
                    className="text-indigo-400"
                  />

                </div>


                {/* INFORMATION */}

                <div className="min-w-0 flex-1">

                  <h3 className="truncate text-sm font-medium text-slate-200">
                    {title}
                  </h3>


                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">

                    <span>
                      {formatDate(
                        updatedAt
                      )}
                    </span>


                    {document?.workspace?.name && (
                      <>
                        <span className="text-slate-700">
                          •
                        </span>

                        <span className="truncate">
                          {document.workspace.name}
                        </span>
                      </>
                    )}

                  </div>

                </div>


                {/* ARROW */}

                <ArrowRight
                  size={15}
                  className="shrink-0 text-slate-700 transition group-hover:translate-x-0.5 group-hover:text-indigo-400"
                />

              </button>
            );

          }
        )}

      </div>

    </section>
  );
};


export default RecentDocuments;