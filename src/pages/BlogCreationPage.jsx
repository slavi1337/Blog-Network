import 'react-quill-new/dist/quill.snow.css';
import ReactQuill from 'react-quill-new';
import Navbar from "../components/Navbar.jsx";

const BlogCreationPage = () => {
    return (
    <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64">
        <Navbar/>
        <div className='h-[calc(100vh-64px)] md:h-[calc(100vh-80px)]'>
            <h1>Kreirajte novi blog</h1>
            <form action="">
                <input type="text" placeholder="Moj blog..."/>
                <div>
                    <label htmlFor="">Kategorija bloga: </label>
                    <select name="kategorija" id="">
                        <option value="uopsteno">Uopšteno</option>
                        <option value="biznis">Biznis</option>
                        <option value="sport">Sport</option>
                        <option value="edukacija">Edukacija</option>
                        <option value="licniPogledi">Lični pogledi</option>
                        <option value="zdravlje">Zdravlje</option>
                        <option value="drustvo">Društvo</option>
                        <option value="politika">Politika</option>
                        <option value="tehnologija">Tehnologija</option>
                        <option value="finansije">Finansije</option>
                        <option value="priroda">Priroda</option>
                    </select>
                </div>
                <ReactQuill theme='snow'/>
                <button>Objavi</button>
            </form>
        </div>
    </div>
    )
}

export default BlogCreationPage;