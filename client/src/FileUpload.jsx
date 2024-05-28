import React from 'react';

const FileUpload = ({ handleFileUpload,handleMediaUpload, inputFile,inputFileMedia }) => {
  return (
    <>
      <form id="uploadFormPhotos">
        <label>
          <input type="file" ref={inputFileMedia} id="photos" name="photos" multiple onChange={handleMediaUpload} />
        </label>
      </form>
      <form id="uploadFormFile">
        <label>
          <input type="file" ref={inputFile} id="file" name="file" onChange={handleFileUpload} />
        </label>
      </form>
    </>
  );
};

export default FileUpload;
