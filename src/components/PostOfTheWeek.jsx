const PostOfTheWeek = () => {
    return (
        <div className="mt-8 text-center">
            <h1 className="text-3xl font-bold text-orange-600 mb-6">Objava sedmice!</h1>
            <div className="flex flex-row border-4 border-orange-500 p-4 mt-4">
                <img src="public/vite.svg" alt="Image" className="w-1/4 mr-8"/>
                <div className="text-center w-3/4">
                    <div className="mb-4">
                        <h1 className="font-bold text-xl">Naslov bloga</h1>
                        <span className="text-gray-500 mr-4">ime korisnika</span>
                        <span className="text-gray-500 mr-4">-</span>
                        <span className="text-gray-500 mr-4">vrijeme objave</span>
                        <span className="text-gray-500 mr-4">-</span>
                        <span className="text-gray-500 mr-4">kategorija</span>
                    </div>
                    <p className="">Lorem ipsum dolor sit, amet consectetur adipisicing elit. Accusamus quasi vitae tempore velit provident. Nemo eligendi deserunt eaque vero, cupiditate similique, a ea repudiandae neque amet nisi eius consectetur doloribus!</p>
                </div>
            </div>
        </div>
    )
}

export default PostOfTheWeek;