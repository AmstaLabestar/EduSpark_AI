import { useNavigate } from "react-router";
import { GraduationCap, BookOpen } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8 flex justify-center">
          <div className="bg-blue-600 rounded-3xl p-6 shadow-lg">
            <GraduationCap className="w-16 h-16 text-white" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl mb-4 text-gray-900">EduLearn BF</h1>

        <p className="text-xl md:text-2xl text-gray-700 mb-12 leading-relaxed">
          Apprends et comprends tes cours avec ton assistant pedagogique
        </p>

        <div className="space-y-4 max-w-md mx-auto">
          <button
            onClick={() => navigate("/login?type=student")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 px-8 rounded-2xl text-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
          >
            <BookOpen className="w-7 h-7" />
            <span>Eleve</span>
          </button>

          <button
            onClick={() => navigate("/login?type=teacher")}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-6 px-8 rounded-2xl text-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
          >
            <GraduationCap className="w-7 h-7" />
            <span>Enseignant</span>
          </button>
        </div>
      </div>
    </div>
  );
}
