import "./index.css"

const Navbar = () => {
    return <div className='header'>
        <div className="d-flex justify-content-between p-2  h-100">
            <img src="logo.png" height={'100%'} alt="" />

            <div>
                <div>
                 Login/SingIn
                </div>
            </div>
        </div>
    </div>
}

export default Navbar;