import FileCard from "./FileCard";

const FileGrid = ({
  files = [],
  onDelete,
  canDelete = false,
}) => {
  if (!files.length) {
    return null;
  }

  return (
    <div
      className="
        grid
        grid-cols-1
        gap-4
        sm:grid-cols-2
        xl:grid-cols-3
      "
    >
      {files.map((file) => {
        const fileId =
          file?._id ||
          file?.id;

        return (
          <FileCard
            key={fileId}
            file={file}
            onDelete={onDelete}
            canDelete={canDelete}
          />
        );
      })}
    </div>
  );
};

export default FileGrid;