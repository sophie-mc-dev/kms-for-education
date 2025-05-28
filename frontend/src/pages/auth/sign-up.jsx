import { useState } from "react";
import {
  Input,
  Checkbox,
  Button,
  Typography,
} from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import UserPreferencesForm from "@/widgets/layout/userPreferencesForm";

export function SignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState(null);

  const roleOptions = [
    { value: "student", label: "Student" },
    { value: "educator", label: "Educator" },
  ];

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    userRole: "student",
    educationLevel: "",
    fieldOfStudy: "",
    topicInterests: [],
    preferredContentTypes: [],
    languagePreference: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleNextButton = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword)
      return alert("Passwords do not match.");

    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword)
      return alert("Passwords do not match.");

    try {
      const res = await axios.post("http://localhost:8080/api/auth/sign-up", {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        userRole: formData.userRole,
        educationLevel: formData.educationLevel,
        fieldOfStudy: formData.fieldOfStudy,
        topicInterests: formData.topicInterests,
        preferredContentTypes: formData.preferredContentTypes,
        languagePreference: formData.languagePreference,
      });

      const userId = res.data.userId;
      if (userId) {
        localStorage.setItem("userId", userId);
        setUserId(userId);
      }

      navigate("/dashboard/search");
    } catch (err) {
      console.error(err);
      alert("Registration failed.");
    }
  };

  const handleSkipStep2 = async () => {
    try {
      const res = await axios.post("http://localhost:8080/api/auth/sign-up", {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        userRole: formData.userRole,
        educationLevel: null,
        fieldOfStudy: null,
        topicInterests: [],
        preferredContentTypes: [],
        languagePreference: null,
      });

      const user = res.data.user;
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
        setUserId(user.userId);
      }

      navigate("/dashboard/search");
    } catch (err) {
      console.error(err);
      alert("Registration failed.");
    }
  };

  return (
    <section className="m-8 flex">
      <div className="w-2/5 h-full hidden lg:block">
        <img
          src="/img/pattern.png"
          className="h-full w-full object-cover rounded-3xl"
        />
      </div>

      <div className="w-full lg:w-3/5 flex flex-col items-center justify-center">
        <div className="text-center mb-6">
          <Typography variant="h2" className="font-bold">
            {step === 1 ? "Join Us Today" : "Tell Us More About You"}
          </Typography>
        </div>

        <form
          onSubmit={step === 1 ? handleNextButton : handleSubmit}
          className="mt-4 mb-2 mx-auto w-80 max-w-screen-lg lg:w-1/2"
        >
          {step === 1 ? (
            <div className="flex flex-col gap-4">
              <Input
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
              />
              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
              />
              <Input
                type="email"
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
              <Input
                type={showPassword ? "text" : "password"}
                label="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
              <Input
                type={showPassword ? "text" : "password"}
                label="Confirm Password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <Checkbox
                label="Show Password"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
              />
              <Select
                name="userRole"
                value={roleOptions.find(
                  (option) => option.value === formData.userRole
                )}
                onChange={(selectedOption) =>
                  setFormData({ ...formData, userRole: selectedOption.value })
                }
                options={roleOptions}
                className="basic-multi-select text-sm"
                classNamePrefix="select"
              />
              <Button type="submit" fullWidth>
                Next
              </Button>
            </div>
          ) : (
            <UserPreferencesForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              onSkip={handleSkipStep2}
              showSkip={true}
            />
          )}
        </form>
      </div>
    </section>
  );
}

export default SignUp;
