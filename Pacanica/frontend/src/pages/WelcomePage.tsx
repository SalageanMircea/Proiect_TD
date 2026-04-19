import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deleteUser,
  onAuthStateChanged,
  signOut,
  updateEmail,
  updatePassword,
} from "firebase/auth";
import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

type Player = {
  username: string;
  usernameLower: string;
  balance: number;
};

function WelcomePage() {
  const navigate = useNavigate();

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [message, setMessage] = useState("");

  const normalizeUsername = (value: string) => value.trim().toLowerCase();

  const usernameToEmail = (value: string) => {
    return `${normalizeUsername(value)}@pacanica.local`;
  };

  const isValidUsername = (value: string) => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(value.trim());
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/");
        return;
      }

      try {
        const snap = await getDoc(doc(db, "players", user.uid));

        if (snap.exists()) {
          const data = snap.data() as Player;
          setPlayer(data);
          setNewUsername(data.username);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const handleChangeUsername = async () => {
    setMessage("");

    const user = auth.currentUser;
    if (!user) {
      setMessage("No user is logged in.");
      return;
    }

    const cleanUsername = newUsername.trim();
    const usernameLower = normalizeUsername(cleanUsername);
    const fakeEmail = usernameToEmail(cleanUsername);

    if (!isValidUsername(cleanUsername)) {
      setMessage(
        "Username must be 3-20 characters and use only letters, numbers or underscore."
      );
      return;
    }

    try {
      await updateEmail(user, fakeEmail);

      await updateDoc(doc(db, "players", user.uid), {
        username: cleanUsername,
        usernameLower,
      });

      setPlayer((prev) =>
        prev
          ? {
              ...prev,
              username: cleanUsername,
              usernameLower,
            }
          : {
              username: cleanUsername,
              usernameLower,
              balance: 0,
            }
      );

      setMessage("Username changed successfully.");
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        setMessage("That username is already taken.");
      } else if (error.code === "auth/requires-recent-login") {
        setMessage("Please log in again, then try changing the username.");
      } else {
        setMessage(error.message || "Could not change username.");
      }
    }
  };

  const handleChangePassword = async () => {
    setMessage("");

    const user = auth.currentUser;
    if (!user) {
      setMessage("No user is logged in.");
      return;
    }

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    try {
      await updatePassword(user, newPassword);
      setNewPassword("");
      setMessage("Password changed successfully.");
    } catch (error: any) {
      if (error.code === "auth/requires-recent-login") {
        setMessage("Please log in again, then try changing the password.");
      } else {
        setMessage(error.message || "Could not change password.");
      }
    }
  };

  const handleDeleteAccount = async () => {
    setMessage("");

    const user = auth.currentUser;
    if (!user) {
      setMessage("No user is logged in.");
      return;
    }

    const ok = window.confirm("Are you sure you want to delete your account?");
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "players", user.uid));
      await deleteUser(user);
      navigate("/");
    } catch (error: any) {
      if (error.code === "auth/requires-recent-login") {
        setMessage("Please log in again, then try deleting the account.");
      } else {
        setMessage(error.message || "Could not delete account.");
      }
    }
  };

  const handleAddBalance = () => {
    setMessage(`Add balance clicked (${balanceAmount || "0"}). Not connected yet.`);
  };

  if (loading) {
    return (
      <div className="page">
        <div className="card">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="card">
        <h1>Welcome{player ? `, ${player.username}` : ""}!</h1>
        <p>Balance: {player?.balance ?? 0}</p>

        <hr style={{ margin: '20px 0' }} />

        <h3>Change username</h3>
        <input
          type="text"
          placeholder="New username"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
        />
        <button className="primary-btn" onClick={handleChangeUsername}>
          Change username
        </button>

        <h3>Change password</h3>
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button className="primary-btn" onClick={handleChangePassword}>
          Change password
        </button>

        <h3>Add balance</h3>
        <input
          type="number"
          placeholder="Amount"
          value={balanceAmount}
          onChange={(e) => setBalanceAmount(e.target.value)}
        />
        <button className="secondary-btn" onClick={handleAddBalance}>
          Add balance
        </button>

        <button className="secondary-btn" onClick={handleLogout}>
          Logout
        </button>

        <button
          onClick={handleDeleteAccount}
          style={{
            width: "100%",
            padding: "12px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            background: "#dc2626",
            color: "white",
            marginTop: "10px",
          }}
        >
          Delete account
        </button>

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}

export default WelcomePage;