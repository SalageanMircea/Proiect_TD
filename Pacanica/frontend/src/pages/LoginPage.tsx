import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

function LoginPage() {
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const normalizeUsername = (value: string) => value.trim().toLowerCase();

  const usernameToEmail = (value: string) => {
    return `${normalizeUsername(value)}@pacanica.local`;
  };

  const isValidUsername = (value: string) => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(value.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    const cleanUsername = username.trim();
    const usernameLower = normalizeUsername(cleanUsername);
    const fakeEmail = usernameToEmail(cleanUsername);

    if (!isValidUsername(cleanUsername)) {
      setMessage(
        "Username must be 3-20 characters and use only letters, numbers or underscore."
      );
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          fakeEmail,
          password
        );

        await setDoc(doc(db, "players", userCredential.user.uid), {
          username: cleanUsername,
          usernameLower,
          balance: 0,
        });

        navigate("/welcome");
      } else {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          fakeEmail,
          password
        );

        const playerRef = doc(db, "players", userCredential.user.uid);
        const playerSnap = await getDoc(playerRef);

        if (!playerSnap.exists()) {
          await setDoc(playerRef, {
            username: cleanUsername,
            usernameLower,
            balance: 0,
          });
        }

        navigate("/welcome");
      }
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        setMessage("Username already exists.");
      } else if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-login-credentials"
      ) {
        setMessage("Invalid username or password.");
      } else {
        setMessage(error.message || "Something went wrong.");
      }
    }
  };

  return (
    <div className="page">
      <form className="card" onSubmit={handleSubmit}>
        <h1>{isRegister ? "Register" : "Login"}</h1>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" className="primary-btn">
          {isRegister ? "Create account" : "Login"}
        </button>

        <button
          type="button"
          className="secondary-btn"
          onClick={() => {
            setIsRegister(!isRegister);
            setMessage("");
          }}
        >
          {isRegister ? "I already have an account" : "Create new account"}
        </button>

        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
}

export default LoginPage;