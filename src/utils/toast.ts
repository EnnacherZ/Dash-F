import { toast, Zoom } from "react-toastify";

export const showToast = (message:string, event : "success" | "error") => {
            if(event == "error"){
                toast.error(message,{
                  position: "top-center",
                  autoClose: 2000,
                  hideProgressBar: false,
                  closeOnClick: false,
                  pauseOnHover: false,
                  draggable: true,
                  progress: undefined,
                  theme: "colored",
                  transition: Zoom,
                })
            }else if(event == "success"){
                toast.success(message,{
                  position: "top-center",
                  autoClose: 2000,
                  hideProgressBar: false,
                  closeOnClick: false,
                  pauseOnHover: false,
                  draggable: true,
                  progress: undefined,
                  theme: "colored",
                  transition: Zoom,
                })
            }


}
