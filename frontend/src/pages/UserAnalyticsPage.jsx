import React, { useState, useEffect } from "react";
// Svi grafikoni u jednom importu
import { 
  BarChart, Bar, Cell, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useAuth } from "@clerk/clerk-react";

const UserAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      if (!isLoaded || !isSignedIn) return;

      try {
        const token = await getToken();
        const response = await fetch("http://localhost:3000/api/users/stats/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Greška: " + response.status);

        const json = await response.json();
        setData(json);
      } catch (err) {
        console.error("Greška pri dohvatanju:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isLoaded, isSignedIn, getToken]);

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <h2 className="text-2xl font-bold text-orange-500 animate-pulse">Učitavanje podataka iz tvoje baze...</h2>
    </div>
  );

  if (!data) return (
    <div className="p-20 text-center">
      <h2 className="text-red-500 text-xl font-bold">Greška pri dohvatanju analitike.</h2>
      <p className="text-gray-600">Provjeri da li si ulogovana i da li backend radi.</p>
    </div>
  );

  
  const allCategories = [
    { name: "Društvo", color: "#3b82f6" },
    { name: "Edukacija", color: "#a855f7" },
    { name: "Gejming", color: "#f97316" },
    { name: "IT", color: "#6366f1" },
    { name: "Kuvanje", color: "#22c55e" },
    { name: "Ostalo", color: "#ef4444" },
    { name: "Priroda", color: "#0ea5e9" },
    { name: "Putovanja", color: "#eab308" },
    { name: "Tehnologija", color: "#10b981" },
    { name: "Videoigre", color: "#f43f5e" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-10">
      <div className="max-w-7xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-200">
        
        
        <div className="bg-orange-500 text-white p-3 rounded-t-lg mb-6 shadow-md">
          <h1 className="text-xl font-bold text-center uppercase tracking-wider">Analitika mog profila</h1>
        </div>
        
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          {[
            { label: "OBJAVE", value: data.cards.posts_count },
            { label: "PREGLEDI", value: data.cards.total_views },
            { label: "KOMENTARI", value: data.cards.comments_count },
            { label: "LAJKOVI", value: data.cards.likes_count },
            { label: "PRATIOCI", value: data.cards.followers_count }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl border-2 border-gray-100 shadow-sm relative overflow-hidden group hover:border-orange-400 transition-colors">
              <div className="absolute left-0 top-0 h-full w-1.5 bg-orange-500"></div>
              <p className="text-[10px] font-bold text-gray-400 mb-1 tracking-tighter uppercase">{item.label}</p>
              <h2 className="text-3xl font-black text-gray-800">{item.value || 0}</h2>
            </div>
          ))}
        </div>

        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          
          <div className="lg:col-span-2 border-4 border-orange-400 rounded-2xl p-6 bg-white shadow-inner">
            <h3 className="text-lg font-bold text-gray-700 mb-6 flex items-center">
              <span className="w-2 h-6 bg-orange-500 mr-3 rounded-full"></span>
              Aktivnost objavljivanja
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#f97316" 
                    strokeWidth={4} 
                    dot={{ r: 6, fill: "#f97316", strokeWidth: 2, stroke: "#fff" }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          
          <div className="border-4 border-gray-100 rounded-2xl p-6 bg-white shadow-sm flex flex-col">
            <h3 className="text-md font-bold text-gray-700 mb-6 uppercase tracking-tight">Zastupljenost kategorija</h3>
            
            
            <div className="h-48 w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.categoryData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="label" type="category" hide />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    {data.categoryData && data.categoryData.map((entry, index) => {
                      const catInfo = allCategories.find(c => c.name.toLowerCase() === entry.label.toLowerCase());
                      return <Cell key={`cell-${index}`} fill={catInfo ? catInfo.color : '#cbd5e1'} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-auto border-t pt-4">
              {allCategories.map((cat, idx) => (
                <div key={idx} className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: cat.color }}></div>
                  <span className="text-[9px] font-bold text-gray-500 uppercase">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default UserAnalyticsPage;