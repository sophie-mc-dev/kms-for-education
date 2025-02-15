import { useState } from "react";
import { Card, Input, Checkbox, Button, Typography, Select, Option } from "@material-tailwind/react";
import { Link } from "react-router-dom";
import axios from "axios";

export function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: "student",
    termsAccepted: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (!formData.role) {
      alert("Please select your role.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:8080/api/auth/sign-up", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
      });
  
      console.log("Registration successful:", response.data);
    } catch (error) {
      console.error("Registration failed:", error);
      alert("Registration failed. Please try again.");
    }


    console.log(formData);
  };

  return (
    <section className="m-8 flex">
      <div className="w-2/5 h-full hidden lg:block">
        <img src="/img/pattern.png" className="h-full w-full object-cover rounded-3xl" />
      </div>
      <div className="w-full lg:w-3/5 flex flex-col items-center justify-center">
        <div className="text-center">
          <Typography variant="h2" className="font-bold mb-4">Join Us Today</Typography>
          <Typography variant="paragraph" color="blue-gray" className="text-lg font-normal">Create an account to get started.</Typography>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 mb-2 mx-auto w-80 max-w-screen-lg lg:w-1/2">
          <div className="mb-4 flex flex-col gap-4">
            <Input size="lg" label="Username" name="username" value={formData.username} onChange={handleChange} required />
            <Input type="email" size="lg" label="Email" name="email" value={formData.email} onChange={handleChange} required />
            <Input type={showPassword ? "text" : "password"} size="lg" label="Password" name="password" value={formData.password} onChange={handleChange} required />
            <Input type={showPassword ? "text" : "password"} size="lg" label="Confirm Password" name="confirmPassword"  value={formData.confirmPassword} onChange={handleChange} required />
            <Checkbox label="Show Password" checked={showPassword} onChange={() => setShowPassword(!showPassword)} />
            <Input size="lg" label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
            <Input size="lg" label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
            <Select label="Role" name="role" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e })} required>
              <Option value="" disabled>Select your role</Option>
              <Option value="student">Student</Option>
              <Option value="educator">Educator</Option>
            </Select>
          </div>
          <Checkbox label={<Typography variant="small" color="gray" className="flex items-center justify-start font-medium">I agree to the <a href="#" className="m-1 font-normal text-black transition-colors hover:text-gray-900 underline">Terms and Conditions</a> and <a href="#" className="m-1 font-normal text-black transition-colors hover:text-gray-900 underline">Privacy Policy</a>.</Typography>} name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange} required />
          <Button className="mt-6" fullWidth type="submit">Register Now</Button>
          <Typography variant="paragraph" className="text-center text-blue-gray-500 font-medium mt-4">Already have an account? <Link to="/auth/sign-in" className="text-gray-900 ml-1">Sign in</Link></Typography>
        </form>
      </div>
    </section>
  );
}

export default SignUp;
