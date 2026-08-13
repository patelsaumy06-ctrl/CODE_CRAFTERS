import React from 'react'
import { useNavigate } from 'react-router-dom'

export const Login = () => {

  const navigate = useNavigate()
  const LoginHandler= ()=>{
    //api call..
    //if else
    //assume if user pass correct login detail he/she will get token
    localStorage.setItem("token","asbisahsaiusgmasyssuhsisahsaiosa")
    //we are assuming role of user is student
    localStorage.setItem("role","student")
    navigate("/admin")
  }
  
  return (
    <div style={{textAlign:"center"}}>
        <h1>LOGIN</h1>
        <button onClick={()=>{LoginHandler()}}>LOGIN</button>
    </div>
  )
}