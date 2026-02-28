import { useEffect, useState } from "react";
import axios from "axios";

type Banner = {
  id: string;
  title: string;
  image: string;
  status: string;
  created_at: string;
};

export default function Hero() {
  const [banner, setBanner] = useState<Banner | null>(null);

  useEffect(() => {
    axios
      .get<Banner[]>("https://xiadot.com/admin_maths/api/get-banners.php")
      .then((res) => {
        if (res.data.length > 0) {
          setBanner(res.data[0]);
        }
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-16 md:py-24">
      <div className="relative max-w-7xl mx-auto px-4 flex justify-center">
        <div className="relative w-full max-w-4xl">
          {banner ? (
            <img
              src={banner.image}
              alt={banner.title}
              className="rounded-3xl shadow-2xl w-full max-h-[500px] object-cover"
            />
          ) : (
            <div className="h-[400px] flex items-center justify-center bg-gray-200 rounded-3xl">
              <p className="text-gray-500">No Banner Available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
