import { useMutation } from "@tanstack/react-query";
import { firebaseAuth } from "@/core/firebase";

export function useUploadPhoto() {
  return useMutation({
    mutationFn: async ({
      submissionId,
      questionId,
      file,
    }: {
      submissionId: string;
      questionId: string;
      file: File;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("questionId", questionId);

      const token = firebaseAuth.currentUser
        ? await firebaseAuth.currentUser.getIdToken()
        : localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/v1/student/submissions/${submissionId}/photo`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
          body: formData,
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message || "Upload failed");
      }

      return res.json() as Promise<{ data: { photoUrl: string }; message: string }>;
    },
  });
}
