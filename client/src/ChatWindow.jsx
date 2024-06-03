import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import FileUpload from "./FileUpload";
import person4 from "./assets/scale_1200.jpg";
import Picker from "emoji-picker-react";

const ChatWindow = ({ array }) => {
  const { chatId } = useParams();
  const [me, setMe] = useState({ name: "Ramin", image: person4 });
  const [history, setHistory] = useState([]);
  const [emojiModal, setEmojiModal] = useState(false);
  const [message1, setMessage1] = useState("");
  const [uploadFile, setUploadFile] = useState({});
  const [uploadVoice, setUploadVoice] = useState({});
  const [photosArray, setPhotosArray] = useState([]);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [audioUrl, setAudioUrl] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);

  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io("http://localhost:3000");

    socketRef.current.on("chat history", function (history) {
      setHistory(history);
    });
    console.log(history);

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (chatId) {
      socketRef.current.emit("join chat", {
        userfirst: me.name,
        usersecond: chatId,
      });
      socketRef.current.emit("read chat", {
        userfirst: me.name,
        usersecond: chatId,
      });
    }
  }, [chatId]);

  const inputFile = useRef(null);
  const inputFileMedia = useRef(null);

  const handleResetMedia = () => {
    if (inputFileMedia.current) {
      inputFileMedia.current.value = "";
      inputFileMedia.current.type = "file";
    }
  };

  const handleResetFile = () => {
    if (inputFile.current) {
      inputFile.current.value = "";
      inputFile.current.type = "file";
    }
  };

  const handleMediaUpload = async (event) => {
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(file);
      const formData = new FormData();
      const reader = new FileReader();

      if (file.type.split("/")[0] === "video") {
        console.log(file.type.split("/")[0]);
        formData.append("photos", file);
        try {
          const response = await axios.post(
            "http://localhost:3000/upload-media",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          let data = await response.data;

          setPhotosArray((prev) => [...prev, ...data]);
        } catch (error) {
          console.error("Error uploading file:", error);
        }
      } else {
        console.log(file.type.split("/")[0]);

        reader.onload = (e) => {
          setPhotosArray((prev) => [
            ...prev,
            {
              fileByte: e.target.result.split(",")[1],
              fileType: file.type,
              fileName: file.name,
            },
          ]);
        };

        reader.readAsDataURL(file);
      }
    }
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    const file = files[0];

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        "http://localhost:3000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUploadFile({
        nameoffile: response.data.file.filename,
        file: file,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    recorder.start();

    setAudioChunks([]);
    recorder.addEventListener("dataavailable", (event) => {
      setAudioChunks((prev) => [...prev, event.data]);
    });

    recorder.addEventListener("stop", () => {
      const blob = new Blob(audioChunks, { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setAudioBlob(blob);
    });

    setMediaRecorder(recorder);
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.stop();
    setIsRecording(false);
  };

  const sendAudio = async () => {
    if (audioBlob) {
      const formData = new FormData();
      let randomText = "QWERTYUIOPASDFGHJKLZXCVBNM123456789";
      let fileText = "";
      for (let index = 0; index < 12; index++) {
        const element =
          randomText[Math.floor(Math.random() * randomText.length)];
        fileText += element;
      }

      formData.append("audio", audioBlob, fileText + ".wav");

      try {
        const response = await axios.post(
          "http://localhost:3000/voice-add",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        console.log("Voice upload response:", response.data);
        return response.data.file.filename;
      } catch (error) {
        console.error("Error uploading audio:", error);
        return null;
      }
    }
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const voiceFileName = await sendAudio();
    console.log("Uploaded voice file name:", voiceFileName);
    
    const obj = {
      message: message1,
      fromuser: me.name,
      userfirst: me.name,
      usersecond: chatId,
      file: uploadFile,
      nameoffile: uploadFile.nameoffile,
      photos: photosArray,
      voice: voiceFileName,
    };

    console.log("Sending message:", obj);
    socketRef.current.emit("chat message", obj);
    setHistory((prevState) => [...prevState, obj]);
    setMessage1("");
    setUploadFile({});
    handleResetMedia();
    handleResetFile();
    setPhotosArray([]);
  };

  const onEmojiClick = (event, emojiObject) => {
    setMessage1((prev) => prev + event.emoji);
  };

  const renderChatMessage = (msg, index) => {
    const photos = msg.photos.map((base64Photo, idx) => (
      <li key={idx}>
        {base64Photo.fileType.split("/")[0] === "image" ? (
          <img
            src={`data:${base64Photo.fileType};base64,${base64Photo.fileByte}`}
            alt="Photo"
          />
        ) : (
          <video controls>
            <source
              src={`http://localhost:3000/upload-folder/${base64Photo.fileName}`}
              type={base64Photo.fileType}
            />
          </video>
        )}
        {}
      </li>
    ));
    return (
      <li
        key={index}
        className={msg.fromuser === me.name ? "from-messages" : "to-messages"}
      >
        <div>
          <img
            src={
              msg.fromuser === me.name
                ? me.image
                : array.find((item) => item.name === chatId).image
            }
            alt="user"
          />
          {msg.message && (
            <span
              className={
                msg.fromuser === me.name
                  ? "from-messages-color"
                  : "to-messages-color"
              }
            >
              {msg.message}
            </span>
          )}

          {msg.nameoffile && (
            <a
              className={
                msg.fromuser === me.name
                  ? "from-messages-color"
                  : "to-messages-color"
              }
              href={`http://localhost:3000/download?nameoffile=${msg.nameoffile}`}
            >
              {msg.nameoffile}
            </a>
          )}
          {msg.voice && (
            <audio controls>
              <source src={`http://localhost:3000/upload-folder/${msg.voice}`} />
            </audio>
          )}
        </div>
        {photos.length > 0 && <ul>{photos}</ul>}
      </li>
    );
  };

  return (
    <div id="chat">
      <div className="chat-info">
        <img src={array.find((item) => item.name === chatId).image} alt="" />
      </div>
      <ul id="messages">{history.map(renderChatMessage)}</ul>
      <div className="message-area">
        <FileUpload
          handleFileUpload={handleFileUpload}
          handleMediaUpload={handleMediaUpload}
          inputFile={inputFile}
          inputFileMedia={inputFileMedia}
        />
        <form id="form1" onSubmit={handleSubmit}>
          <input
            id="m1"
            value={message1}
            onChange={(e) => setMessage1(e.target.value)}
            autoComplete="off"
          />
          <button type="submit"></button>
        </form>
        <button onClick={() => setEmojiModal(!emojiModal)} id="emoji"></button>
        <div>
          {!isRecording && (
            <button onClick={startRecording}>Start Recording</button>
          )}
          {isRecording && (
            <button onClick={stopRecording}>Stop Recording</button>
          )}
        </div>
      </div>
      {emojiModal && <Picker onEmojiClick={onEmojiClick} />}
    </div>
  );
};

export default ChatWindow;
