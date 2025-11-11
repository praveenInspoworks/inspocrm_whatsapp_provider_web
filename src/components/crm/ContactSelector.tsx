import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Mail,
  MessageSquare,
  Users,
  CheckCircle,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/services/apiService";

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  companyId?: number | null;
  position?: string;
  department?: string;
  status: 'ACTIVE' | 'INACTIVE';
  isActive: boolean;
  companyName?: string;
  industry?: string;
  priority?: string;
  notes?: string;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

interface Company {
  id: string;
  name: string;
  contactCount?: number;
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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [selectAll, setSelectAll] = useState(false);
  const [filterBy, setFilterBy] = useState<'all' | 'email' | 'whatsapp' | 'both'>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const contactsPerPage = 10;
  const { toast } = useToast();

  // Fetch companies and contacts
  useEffect(() => {
    fetchCompanies();
    fetchContacts();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterBy, companyFilter]);

  const fetchCompanies = async () => {
    setIsLoadingCompanies(true);
    try {
      // Call companies API
      const response = await apiService.get('/api/v1/companies/all');
      setCompanies(response.data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      // Mock companies data for demo
      setCompanies([
        { id: '1', name: 'Tech Corp', contactCount: 2 },
        { id: '2', name: 'StartupXYZ', contactCount: 2 },
        { id: '3', name: 'Enterprise Inc', contactCount: 2 },
        { id: '4', name: 'Business Solutions', contactCount: 2 },
        { id: '5', name: 'Consulting Pro', contactCount: 2 },
        { id: '6', name: 'Marketing Agency', contactCount: 2 }
      ]);
    } finally {
      setIsLoadingCompanies(false);
    }
  };

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
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and paginate contacts
  const { filteredContacts, paginatedContacts, totalPages } = useMemo(() => {
    let filtered = contacts;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(contact =>
        contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone?.includes(searchTerm)
      );
    }

    // Apply company filter
    if (companyFilter !== 'all') {
      filtered = filtered.filter(contact => contact.companyId?.toString() === companyFilter);
    }

    // Apply contact method filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(contact => {
        switch (filterBy) {
          case 'email':
            return showEmail && contact.email;
          case 'whatsapp':
            return showWhatsApp && contact.phone;
          case 'both':
            return (showEmail && contact.email) && (showWhatsApp && contact.phone);
          default:
            return true;
        }
      });
    }

    // Pagination
    const startIndex = (currentPage - 1) * contactsPerPage;
    const endIndex = startIndex + contactsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filtered.length / contactsPerPage);

    return {
      filteredContacts: filtered,
      paginatedContacts: paginated,
      totalPages
    };
  }, [contacts, searchTerm, companyFilter, filterBy, currentPage, showEmail, showWhatsApp]);

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

  const handleSelectPage = () => {
    const pageContacts = paginatedContacts.filter(contact =>
      !selectedContacts.some(selected => selected.id === contact.id)
    );

    if (pageContacts.length === 0) return;

    const newSelection = [...selectedContacts];
    let added = 0;

    for (const contact of pageContacts) {
      if (newSelection.length >= maxSelections) break;
      newSelection.push(contact);
      added++;
    }

    onContactsSelected(newSelection);

    if (added > 0) {
      toast({
        title: "Contacts Added",
        description: `Added ${added} contacts from current page`,
      });
    }
  };

  const getContactMethodIcon = (contact: Contact) => {
    const hasEmail = showEmail && contact.email;
    const hasWhatsApp = showWhatsApp && contact.phone;

    if (hasEmail && hasWhatsApp) {
      return <Badge variant="secondary" className="text-xs px-2 py-0.5">Both</Badge>;
    } else if (hasEmail) {
      return <Mail className="h-4 w-4 text-blue-500" />;
    } else if (hasWhatsApp) {
      return <MessageSquare className="h-4 w-4 text-green-500" />;
    }
    return null;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading contacts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Select Recipients for WhatsApp Campaign
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose contacts to send your WhatsApp message template to
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts by name, company, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select 
            value={companyFilter} 
            onValueChange={setCompanyFilter}
            disabled={isLoadingCompanies}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                isLoadingCompanies ? "Loading companies..." : "Filter by company"
              } />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map(company => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name} 
                  {company.contactCount !== undefined && ` (${company.contactCount})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant={filterBy === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterBy('all')}
              className="flex-1"
            >
              All
            </Button>
            {showWhatsApp && (
              <Button
                variant={filterBy === 'whatsapp' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterBy('whatsapp')}
                className="flex-1"
              >
                <MessageSquare className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Selection Summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/50 rounded-lg border gap-3">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectAll}
              onCheckedChange={handleSelectAll}
              className="h-4 w-4"
            />
            <div>
              <Label className="text-sm font-medium cursor-pointer" onClick={handleSelectAll}>
                Select All Visible ({filteredContacts.length})
              </Label>
              <p className="text-xs text-muted-foreground">
                Selected: {selectedContacts.length}/{maxSelections} • {selectedContacts.filter(c => c.phone).length} with WhatsApp
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectPage}
            disabled={paginatedContacts.every(contact =>
              selectedContacts.some(selected => selected.id === contact.id)
            )}
          >
            Select Page
          </Button>
        </div>

        {/* Contact List */}
        <div className="border rounded-lg max-h-[400px] overflow-y-auto">
          <div className="p-3">
            {paginatedContacts.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">
                  {searchTerm || companyFilter !== 'all' || filterBy !== 'all' ? 'No contacts found' : 'No contacts available'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm || companyFilter !== 'all' || filterBy !== 'all' ? 'Try adjusting your search or filters' : 'Add some contacts to get started'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedContacts.map(contact => {
                  const isSelected = selectedContacts.some(c => c.id === contact.id);

                  return (
                    <div
                      key={contact.id}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
                        isSelected
                          ? 'bg-primary/5 border-primary shadow-sm'
                          : 'hover:bg-muted/30 border-border'
                      }`}
                      onClick={() => handleContactToggle(contact)}
                    >
                      <Checkbox
                        checked={isSelected}
                        className="h-4 w-4 flex-shrink-0 mt-1"
                        onChange={() => {}} // Prevent double triggering
                      />

                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                          {getInitials(contact.firstName, contact.lastName)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {contact.firstName} {contact.lastName}
                          </h4>
                          {contact.status === 'ACTIVE' && (
                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                          )}
                          <div className="flex-shrink-0">
                            {getContactMethodIcon(contact)}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-muted-foreground mb-2">
                          {contact.companyName && (
                            <span className="truncate">{contact.companyName}</span>
                          )}
                          {contact.position && (
                            <span className="hidden sm:inline">•</span>
                          )}
                          {contact.position && (
                            <span className="truncate">{contact.position}</span>
                          )}
                          {contact.department && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span className="truncate">{contact.department}</span>
                            </>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          {contact.email && showEmail && (
                            <div className="flex items-center gap-1 text-xs">
                              <Mail className="h-3 w-3 text-blue-500 flex-shrink-0" />
                              <span className="truncate text-muted-foreground">{contact.email}</span>
                            </div>
                          )}
                          {contact.phone && showWhatsApp && (
                            <div className="flex items-center gap-1 text-xs">
                              <MessageSquare className="h-3 w-3 text-green-500 flex-shrink-0" />
                              <span className="truncate text-muted-foreground">{contact.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t bg-muted/20 gap-3">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                Showing {((currentPage - 1) * contactsPerPage) + 1} to {Math.min(currentPage * contactsPerPage, filteredContacts.length)} of {filteredContacts.length} contacts
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Previous</span>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (pageNum > totalPages) return null;

                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0 text-xs"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <span className="hidden sm:inline mr-1">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Selected Contacts Summary */}
        {selectedContacts.length > 0 && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
              <h4 className="font-medium">Selected Contacts ({selectedContacts.length})</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onContactsSelected([])}
                className="h-8 px-2 self-end sm:self-auto"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
              {selectedContacts.map(contact => (
                <Badge key={contact.id} variant="default" className="text-xs px-2 py-1">
                  {contact.firstName} {contact.lastName}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
