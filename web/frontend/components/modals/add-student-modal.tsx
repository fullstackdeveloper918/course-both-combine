"use client"
import React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"




export default function AddStudentModal({ isOpen, onClose, onSubmit }) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("student")
  const [shopifyCustomerId, setShopifyCustomerId] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      onSubmit({
        email,
        firstName,
        lastName,
        role,
      });

      // Reset form fields
      setEmail("");
      setFirstName("");
      setLastName("");
      setRole("student");
      setLoading(false);
    }, 500);
  };

  return (
    <Dialog open={isOpen}  onOpenChange={onClose}>
      <DialogContent    onInteractOutside={(e) => e.preventDefault()} className="bg-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Student</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentEmail">Email</Label>
            <Input
              id="studentEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john.doe@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shopifyCustomerId">Shopify Customer ID (Optional)</Label>
            <Input
              id="shopifyCustomerId"
              value={shopifyCustomerId}
              onChange={(e) => setShopifyCustomerId(e.target.value)}
              placeholder="123456789"
            />
            <p className="text-xs text-gray-500">Link to existing Shopify customer</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="default" type="submit" disabled={loading || !firstName || !lastName || !email}>
              {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : null}
              Add Student
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
