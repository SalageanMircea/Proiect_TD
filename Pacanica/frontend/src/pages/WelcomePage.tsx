import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/");
        return;
      }

      try {
        const snap = await getDoc(doc(db, "players", user.uid));

        if (snap.exists()) {
          setPlayer(snap.data() as Player);
        }
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

        <button className="primary-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default WelcomePage;