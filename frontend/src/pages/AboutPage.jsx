const AboutPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 border-b pb-4">
          O Nama
        </h1>
        <div className="prose lg:prose-lg max-w-none text-gray-700 space-y-4">
          <p>
            Dobrodošli na <strong>Blog Network</strong>, platformu stvorenu za
            sve ljubitelje pisanja i dijeljenja znanja. Naša misija je da
            pružimo jednostavan, elegantan i moćan alat koji omogućava autorima
            da se fokusiraju na ono što je najvažnije - kreiranje kvalitetnog
            sadržaja.
          </p>
          <p>
            Vjerujemo da svako ima priču vrijednu dijeljenja, bilo da se radi o
            stručnom znanju iz vaše profesije, ličnim iskustvima, kreativnom
            pisanju ili uputstvima za neki hobi. Blog Network je mjesto gdje te
            priče oživljavaju.
          </p>
          <h2 className="text-2xl font-bold mt-6">Naše Vrijednosti</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Jednostavnost:</strong> Intuitivan interfejs koji vam ne
              stoji na putu.
            </li>
            <li>
              <strong>Zajednica:</strong> Povežite se sa drugim autorima i
              čitaocima kroz praćenje, komentare i diskusije.
            </li>
            <li>
              <strong>Prilagodljivost:</strong> Personalizujte svoje iskustvo
              odabirom tema koje vas interesuju.
            </li>
            <li>
              <strong>Performanse:</strong> Brza i responzivna platforma
              dostupna na svim uređajima.
            </li>
          </ul>
          <p className="mt-6">
            Hvala vam što ste dio naše zajednice. Srećno pisanje!
          </p>
          <div className="flex justify-center">
            <div className="flex items-center gap-x-16">
              <img
                src={"logo.png"}
                alt="Logo kompanije"
                className="w-20 h-20 object-contain"
              />
              <img
                src={"etfbl.jpg"}
                alt="Logo ETFBL"
                className="w-20 h-20 rounded-full object-cover"
              />
              <img
                src={"unibl.jpg"}
                alt="Logo UNIBL"
                className="w-20 h-20 rounded-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AboutPage;
