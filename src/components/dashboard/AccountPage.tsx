
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const AccountPage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "(123) 456-7890",
  });
  const [formData, setFormData] = useState({ ...userData });
  const { toast } = useToast();

  const handleEdit = () => {
    setIsEditing(true);
    setFormData({ ...userData });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({ ...userData });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setUserData({ ...formData });
    setIsEditing(false);
    
    toast({
      title: "Profile updated",
      description: "Your account information has been updated.",
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">My Account</h1>
        <p className="text-gray-600 mt-1">
          View and manage your account information
        </p>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-medium">Personal Information</h2>
            {!isEditing && (
              <Button 
                variant="outline" 
                onClick={handleEdit}
                className="text-rezia-blue border-rezia-blue hover:bg-rezia-blue/5"
              >
                Edit
              </Button>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
              />
            </div>
            
            {isEditing && (
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button className="bg-rezia-blue hover:bg-rezia-blue/90" onClick={handleSave}>
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <hr className="my-8" />
        
        <div className="space-y-6">
          <h2 className="text-xl font-medium">Password</h2>
          
          <div>
            <Button 
              variant="outline" 
              className="text-rezia-blue border-rezia-blue hover:bg-rezia-blue/5"
              onClick={() => {
                toast({
                  title: "Password reset email sent",
                  description: "Check your email for instructions to reset your password.",
                });
              }}
            >
              Change Password
            </Button>
          </div>
        </div>
        
        <hr className="my-8" />
        
        <div className="space-y-6">
          <h2 className="text-xl font-medium text-red-500">Danger Zone</h2>
          
          <div>
            <Button 
              variant="outline" 
              className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
              onClick={() => {
                toast({
                  title: "Are you sure?",
                  description: "This action cannot be undone. Please confirm via email.",
                  variant: "destructive",
                });
              }}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
