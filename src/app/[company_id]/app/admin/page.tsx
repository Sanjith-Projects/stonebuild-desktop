    "use client";
   
   import { useEffect, useState } from "react";
   import { useForm, SubmitHandler } from "react-hook-form";
   import { Button } from "@/components/ui/button";
   import { Input } from "@/components/ui/input";
   import toast from "react-hot-toast";
   import { postRequest } from "../utils/api";
   
   type UserForm = {
     name: string;
     email: string;
     password: string;
     plan_id: string;
     duration_days: string;
   };
   
   export default function UsersPage() {
     const [users, setUsers] = useState<any[]>([]);
   
     // ✅ React Hook Form setup
     const {
       register,
       handleSubmit,
       reset,
       formState: { errors, isSubmitting },
     } = useForm<UserForm>();
   
    const fetchUsers = async () => {
     try {
       const res = await postRequest({
         token: "getUsers",
         data: {},
       });
       setUsers(res.data || []);
     } catch (err: any) {
       toast.error("Failed to load users");
     }
   };
   
   
     const onSubmit: SubmitHandler<UserForm> = async (formData) => {
     try {
       const res = await postRequest({
         token: "addUser",
         data: formData,
       });
   
       if (res.success) {
         toast.success("User added successfully!");
         reset();
         fetchUsers();
       } else {
         toast.error(res.message || "Something went wrong");
       }
     } catch (error: any) {
       toast.error(error.message || "Failed to add user");
     }
   };
   
   
     useEffect(() => {
       fetchUsers();
     }, []);
   
     return (
       <div className="p-6">
         <h1 className="text-2xl font-semibold mb-4">User Management</h1>
   
         {/* Form */}
         <form
           onSubmit={handleSubmit(onSubmit)}
           className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg mb-6"
         >
           <div>
             <Input
               placeholder="Name"
               {...register("name", { required: "Name is required" })}
             />
             {errors.name && (
               <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
             )}
           </div>
   
           <div>
             <Input
               placeholder="Email"
               {...register("email", {
                 required: "Email is required",
                 pattern: {
                   value: /^\S+@\S+$/i,
                   message: "Invalid email",
                 },
               })}
             />
             {errors.email && (
               <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
             )}
           </div>
   
           <div>
             <Input
               placeholder="Password"
               type="password"
               {...register("password", { required: "Password is required" })}
             />
             {errors.password && (
               <p className="text-red-500 text-sm mt-1">
                 {errors.password.message}
               </p>
             )}
           </div>
   
           <div>
             <Input
               placeholder="Plan ID"
               {...register("plan_id", { required: "Plan ID required" })}
             />
             {errors.plan_id && (
               <p className="text-red-500 text-sm mt-1">
                 {errors.plan_id.message}
               </p>
             )}
           </div>
   
           <div>
             <Input
               placeholder="Duration (days)"
               type="number"
               {...register("duration_days", {
                 required: "Duration is required",
                 min: { value: 1, message: "Minimum 1 day" },
               })}
             />
             {errors.duration_days && (
               <p className="text-red-500 text-sm mt-1">
                 {errors.duration_days.message}
               </p>
             )}
           </div>
   
           <div className="flex items-end">
             <Button type="submit" disabled={isSubmitting}>
               {isSubmitting ? "Adding..." : "Add User"}
             </Button>
           </div>
         </form>
   
         {/* User List */}
         <table className="w-full border text-sm">
           <thead className="bg-gray-200">
             <tr>
               <th className="p-2 text-left">#</th>
               <th className="text-left">Name</th>
               <th className="text-left">Email</th>
               <th className="text-left">Status</th>
               <th className="text-left">Plan Expiry</th>
             </tr>
           </thead>
           <tbody>
             {users.map((u, i) => (
               <tr key={i} className="border-t">
                 <td className="p-2">{i + 1}</td>
                 <td>{u.name}</td>
                 <td>{u.email}</td>
                 <td>{u.status}</td>
                 <td>{u.end_date}</td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
     );
   }
   