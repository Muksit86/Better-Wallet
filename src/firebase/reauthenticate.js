import {
  EmailAuthProvider,
  GoogleAuthProvider,
  GithubAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from "firebase/auth";

import { auth } from "./firebase";

// password user
export const reauthenticatePasswordUser = async (password) => {
  const user = auth.currentUser;

  const credential = EmailAuthProvider.credential(user.email, password);

  await reauthenticateWithCredential(user, credential);
};

// google user
export const reauthenticateGoogleUser = async () => {
  const provider = new GoogleAuthProvider();

  await reauthenticateWithPopup(auth.currentUser, provider);
};

// github user
export const reauthenticateGithubUser = async () => {
  const provider = new GithubAuthProvider();

  await reauthenticateWithPopup(auth.currentUser, provider);
};
