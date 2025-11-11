import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Mail,
  MessageSquare,
  Users,
  Filter,
  CheckCircle,
  X,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/services/apiService";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  tags?: string[];
  preferredContactMethod: 'email' | 'whatsapp' | 'both';
  status: 'active' | 'inactive' | 'do_not_contact';
  lastInteraction?: Date;
  avatar?: string;
}

interface ContactSelectorProps {
  onContactsSelected: (contacts: Contact[]) => void;
  selectedContacts: Contact[];
  showEmail?: boolean;
  showWhatsApp?: boolean;
  maxSelections?: number;
}

export function ContactSelector({
  onContactsSelected,
  selectedContacts,
  showEmail = true,
  showWhatsApp = true,
  maxSelections = 100
}: ContactSelectorProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectAll, setSelectAll] = useState(false);
  const [filterBy, setFilterBy] = useState<'all' | 'email' | 'whatsapp' | 'both'>('all');
  const { toast } = useToast();

  // Fetch contacts from your CRM backend
  useEffect(() => {
    fetchContacts();
  }, []);

  // Filter contacts based on search and filter criteria
  useEffect(() => {
    let filtered = contacts;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(contact =>
        contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply contact method filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(contact => {
        switch (filterBy) {
          case 'email':
            return showEmail && contact.email && contact.preferredContactMethod !== 'whatsapp';
          case 'whatsapp':
            return showWhatsApp && contact.phone && contact.preferredContactMethod !== 'email';
          case 'both':
            return (showEmail && contact.email) && (showWhatsApp && contact.phone);
          default:
            return true;
        }
      });
    }

    setFilteredContacts(filtered);
  }, [contacts, searchTerm, filterBy, showEmail, showWhatsApp]);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      // Call your CRM contacts API
      const response = await apiService.get('/api/v1/contacts');
      setContacts(response.data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch contacts",
        variant: "destructive"
      });

      // Mock data for demo when backend is not available
      setContacts([
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@company.com',
          phone: '+1234567890',
          company: 'Tech Corp',
          position: 'CEO',
          preferredContactMethod: 'both',
          status: 'active',
          tags: ['customer', 'vip']
        },
        {
          id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@startup.io',
          company: 'StartupXYZ',
          position: 'CTO',
          preferredContactMethod: 'email',
          status: 'active',
          tags: ['prospect', 'tech']
        },
        {
          id: '3',
          firstName: 'Mike',
          lastName: 'Johnson',
          phone: '+1987654321',
          company: 'Enterprise Inc',
          position: 'Manager',
          preferredContactMethod: 'whatsapp',
          status: 'active',
          tags: ['lead', 'enterprise']
        },
        {
          id: '4',
          firstName: 'Sarah',
          lastName: 'Wilson',
          email: 'sarah@business.com',
          phone: '+1122334455',
          company: 'Business Solutions',
          position: 'Director',
          preferredContactMethod: 'both',
          status: 'active',
          tags: ['customer', 'business']
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactToggle = (contact: Contact) => {
    const isSelected = selectedContacts.some(c => c.id === contact.id);

    if (isSelected) {
      // Remove from selection
      onContactsSelected(selectedContacts.filter(c => c.id !== contact.id));
    } else {
      // Add to selection (check max limit)
      if (selectedContacts.length >= maxSelections) {
        toast({
          title: "Selection Limit Reached",
          description: `You can select up to ${maxSelections} contacts`,
          variant: "destructive"
        });
        return;
      }
      onContactsSelected([...selectedContacts, contact]);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      onContactsSelected([]);
    } else {
      // Select all filtered contacts (up to max limit)
      const contactsToSelect = filteredContacts.slice(0, maxSelections);
      onContactsSelected(contactsToSelect);
    }
    setSelectAll(!selectAll);
  };

  const getContactMethodIcon = (contact: Contact) => {
    const hasEmail = showEmail && contact.email;
    const hasWhatsApp = showWhatsApp && contact.phone;

    if (hasEmail && hasWhatsApp) {
      return <Badge variant="secondary" className="text-xs">Both</Badge>;
    } else if (hasEmail) {
      return <Mail className="h-3 w-3 text-muted-foreground" />;
    } else if (hasWhatsApp) {
      return <MessageSquare className="h-3 w-3 text-muted-foreground" />;
    }
    return null;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading contacts...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Select Contacts for Messaging
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts by name, company, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={filterBy === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterBy('all')}
            >
              All
            </Button>
            {showEmail && (
              <Button
                variant={filterBy === 'email' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBy('email')}
              >
                <Mail className="mr-1 h-3 w-3" />
                Email
              </Button>
            )}
            {showWhatsApp && (
              <Button
                variant={filterBy === 'whatsapp' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBy('whatsapp')}
              >
                <MessageSquare className="mr-1 h-3 w-3" />
                WhatsApp
              </Button>
            )}
            {showEmail && showWhatsApp && (
              <Button
                variant={filterBy === 'both' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBy('both')}
              >
                Both
              </Button>
            )}
          </div>
        </div>

        {/* Selection Summary */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectAll}
              onCheckedChange={handleSelectAll}
            />
            <Label className="text-sm font-medium">
              Select All Visible ({filteredContacts.length})
            </Label>
          </div>

          <div className="text-sm text-muted-foreground">
            Selected: {selectedContacts.length}/{maxSelections}
            {showEmail && ` • ${selectedContacts.filter(c => c.email).length} with email`}
            {showWhatsApp && ` • ${selectedContacts.filter(c => c.phone).length} with WhatsApp`}
          </div>
        </div>

        {/* Contact List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No contacts found matching your search' : 'No contacts available'}
            </div>
          ) : (
            filteredContacts.map(contact => {
              const isSelected = selectedContacts.some(c => c.id === contact.id);

              return (
                <div
                  key={contact.id}
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleContactToggle(contact)}
                >
                  <Checkbox checked={isSelected} />

                  <Avatar className="h-10 w-10">
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback>
                      {getInitials(contact.firstName, contact.lastName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {contact.firstName} {contact.lastName}
                      </p>
                      {contact.status === 'active' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {contact.company && <span>{contact.company}</span>}
                      {contact.position && <span>• {contact.position}</span>}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      {contact.email && showEmail && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="text-xs">{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && showWhatsApp && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span className="text-xs">{contact.phone}</span>
                        </div>
                      )}
                    </div>

                    {contact.tags && contact.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {contact.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {getContactMethodIcon(contact)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Contacts Summary */}
        {selectedContacts.length > 0 && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Selected Contacts ({selectedContacts.length})</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onContactsSelected([])}
              >
                <X className="h-4 w-4" />
                Clear All
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedContacts.slice(0, 5).map(contact => (
                <Badge key={contact.id} variant="default" className="text-xs">
                  {contact.firstName} {contact.lastName}
                  {selectedContacts.length > 5 && <span className="ml-1">+{selectedContacts.length - 5} more</span>}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
