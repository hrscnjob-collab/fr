'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Briefcase,
  Clock,
  Code,
  FileText,
  IndianRupee,
  MapPin,
  Rocket,
  Users,
  Eye,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api';
import { formatExperienceRange } from '@/lib/format';
import { MasterRawItem, jobsApi, masterDataApi, BackendLocation } from '@/lib/scn-api';
import {
  ComboOption,
  MultiSelectCombobox,
  SuggestInput,
  handleEnterAsTab,
  splitIdsAndNames,
  stripNew,
  NEW_PREFIX,
} from '@/components/searchable-combobox';

const BENEFITS_OPTIONS = [
  'Cab',
  'Meal',
  'Insurance',
  'PF',
  'Medical Benefits',
  'Accommodation',
  'Full Accommodation',
];

const ASSETS_OPTIONS = [
  'Bike/Car',
  'LISCENCE',
  'ADHAR CARD',
  'PAN CARD',
  'LAPTOP',
];

const QUAL_CATEGORY_LABELS: Record<string, string> = {
  TEN: '10th Pass',
  TWELVE: '12th Pass',
  DIPLOMA: 'Diploma',
  GRADUATE: 'Graduate',
  POST_GRADUATE: 'Post Graduate',
  ANY: 'Other / Any',
};
const QUAL_CATEGORY_ORDER = ['TEN', 'TWELVE', 'DIPLOMA', 'GRADUATE', 'POST_GRADUATE', 'ANY'];

const blankToUndefined = (v: unknown) =>
  v === '' || v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v)) ? undefined : v;

// Experience is captured as years + months (months 0-11) and sent to the API as total months.
const requiredCount = (max: number) =>
  z.preprocess((v) => blankToUndefined(v) ?? 0, z.coerce.number().int('Must be a whole number').min(0).max(max, `Maximum ${max}`));
const optionalCount = (max: number) =>
  z.preprocess(blankToUndefined, z.coerce.number().int('Must be a whole number').min(0).max(max, `Maximum ${max}`).optional());

const schema = z
  .object({
    jobRoleName: z.string().min(2, 'Job role / title is required'),
    industryId: z.string().optional(),
    industryIds: z.array(z.string()).default([]),
    functionId: z.string().optional(),
    functionIds: z.array(z.string()).default([]),
    functionName: z.string().optional(),
    locationId: z.string().min(1, 'Location is required'),
    jobRoleId: z.string().optional(),
    skillIds: z.array(z.string()).default([]),
    qualificationIds: z.array(z.string()).default([]),
    wageMin: z.coerce.number().min(0, 'Minimum salary must be positive'),
    wageMax: z.coerce.number().min(0, 'Maximum salary must be positive'),
    wageType: z.enum(['monthly', 'annual', 'daily']).default('monthly'),
    workingDays: z.coerce.number().min(1).max(7).default(5),
    workingStatus: z.string().optional(),
    gender: z.enum(['ANY', 'MALE', 'FEMALE']).default('ANY'),
    freshersOnly: z.boolean().default(false),
    shiftType: z.enum(['day', 'night', 'rotational']),
    jobType: z.enum(['full-time', 'part-time', 'contract']),
    headcountRequired: z.coerce.number().min(1, 'Headcount is required'),
    minExperienceYears: requiredCount(60),
    minExperienceMonths: requiredCount(11),
    maxExperienceYears: optionalCount(60),
    maxExperienceMonths: optionalCount(11),
    benefitNames: z.array(z.string()).default([]),
    assetNames: z.array(z.string()).default([]),
    languageIds: z.array(z.string()).default([]),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    highlights: z.string().optional(),
    responsibilities: z.string().optional(),
    requirements: z.string().optional(),
    benefits: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    const hasIndustry = (d.industryIds && d.industryIds.length > 0) || Boolean(d.industryId);
    if (!hasIndustry) {
      ctx.addIssue({ code: 'custom', path: ['industryIds'], message: 'Select at least one industry' });
    }
    if (d.wageMax < d.wageMin) {
      ctx.addIssue({ code: 'custom', path: ['wageMax'], message: 'Maximum wage cannot be less than minimum wage' });
    }
    if (!d.freshersOnly) {
      const hasMax = d.maxExperienceYears !== undefined || d.maxExperienceMonths !== undefined;
      if (hasMax) {
        const min = (d.minExperienceYears ?? 0) * 12 + (d.minExperienceMonths ?? 0);
        const max = (d.maxExperienceYears ?? 0) * 12 + (d.maxExperienceMonths ?? 0);
        if (max < min) {
          ctx.addIssue({
            code: 'custom',
            path: ['maxExperienceYears'],
            message: 'Maximum experience cannot be less than minimum experience',
          });
        }
      }
    }
  });

type FormData = z.infer<typeof schema>;

const splitLines = (value?: string) =>
  String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const formatWage = (min: number, max: number, period = 'monthly') => {
  const suffix = period === 'daily' ? 'per day' : period === 'annual' ? 'per annum' : 'per month';
  if (min >= 100000 || max >= 100000) {
    return `₹${(min / 100000).toFixed(1)} Lakh - ₹${(max / 100000).toFixed(1)} Lakh ${suffix}`;
  }
  return `₹${min.toLocaleString()} - ₹${max.toLocaleString()} ${suffix}`;
};

const EMPTY_ARRAY: any[] = [];

const toOptions = (items: MasterRawItem[]): ComboOption[] =>
  items
    .map((item: any) => ({ value: String(item.id), label: String(item.name ?? item.id) }))
    .filter((o) => o.label);

const stringOptions = (items: string[]): ComboOption[] => items.map((s) => ({ value: s, label: s }));

const SECTION_HEADER = 'flex items-center gap-2 text-indigo-600 font-extrabold text-sm border-b border-slate-50 pb-3';
const CARD = 'p-6 border border-slate-100 rounded-2xl shadow-sm text-left bg-white space-y-4';

export default function CreateJobPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editJobId = searchParams?.get('id') || null;
  const isEditing = Boolean(editJobId);
  const [selectedQualLevel, setSelectedQualLevel] = useState<string>('ALL');

  const [jobRoleSearch, setJobRoleSearch] = useState('');

  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedLocalityId, setSelectedLocalityId] = useState<string>('');

  const [stateInput, setStateInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [localityInput, setLocalityInput] = useState('');

  const { data: statesData, isLoading: isLoadingStates } = useQuery<string[]>({
    queryKey: ['master', 'locations', 'states'],
    queryFn: () => masterDataApi.getStates(),
  });
  const states = statesData ?? EMPTY_ARRAY;

  const { data: citiesData, isLoading: isLoadingCities } = useQuery<string[]>({
    queryKey: ['master', 'locations', 'cities', selectedState],
    queryFn: () => masterDataApi.getCities(selectedState),
    enabled: !!selectedState,
  });
  const cities = citiesData ?? EMPTY_ARRAY;

  const { data: localitiesData, isLoading: isLoadingLocalities } = useQuery<BackendLocation[]>({
    queryKey: ['master', 'locations', 'localities', selectedCity, selectedState],
    queryFn: () => masterDataApi.getLocalities(selectedCity, selectedState),
    enabled: !!selectedCity && !!selectedState,
  });
  const localities = localitiesData ?? EMPTY_ARRAY;

  const stateOptions = useMemo(() => stringOptions(states), [states]);
  const cityOptions = useMemo(() => stringOptions(cities), [cities]);
  const localityOptions = useMemo<ComboOption[]>(
    () => localities.map((l: BackendLocation) => ({ value: String(l.id), label: l.locality })),
    [localities]
  );

  const handleStateChange = (state: string) => {
    if (state === selectedState) {
      setStateInput(state);
      return;
    }
    setSelectedState(state);
    setStateInput(state);
    setSelectedCity('');
    setCityInput('');
    setSelectedLocalityId('');
    setLocalityInput('');
    setValue('locationId', '', { shouldValidate: true });
  };

  const handleCityChange = (city: string) => {
    if (city === selectedCity) {
      setCityInput(city);
      return;
    }
    setSelectedCity(city);
    setCityInput(city);
    setSelectedLocalityId('');
    setLocalityInput('');
    setValue('locationId', '', { shouldValidate: true });
  };

  const handleLocalityChange = (locationId: string) => {
    setSelectedLocalityId(locationId);
    const loc = localities.find((l: BackendLocation) => String(l.id) === locationId);
    setLocalityInput(loc ? loc.locality : '');
    setValue('locationId', locationId, { shouldValidate: true });
  };

  const handleCustomLocality = async (customLocality: string) => {
    const st = selectedState || stateInput.trim();
    const ct = selectedCity || cityInput.trim();
    if (!st || !ct || !customLocality) return;

    setLocalityInput(customLocality);

    try {
      const created = await masterDataApi.create('locations', {
        state: st,
        city: ct,
        locality: customLocality,
      });
      if (created && 'id' in created) {
        const locId = String(created.id);
        setSelectedLocalityId(locId);
        setValue('locationId', locId, { shouldValidate: true });
        return;
      }
    } catch (err) {
      // ignore
    }

    const fallbackId = localities.length > 0 ? String(localities[0].id) : (locations.length > 0 ? String(locations[0].id) : '1');
    setSelectedLocalityId(fallbackId);
    setValue('locationId', fallbackId, { shouldValidate: true });
  };

  const industriesQuery = useQuery({ queryKey: ['master', 'industries'], queryFn: () => masterDataApi.raw('industries') });
  const functionsQuery = useQuery({ queryKey: ['master', 'functions'], queryFn: () => masterDataApi.raw('functions') });
  const locationsQuery = useQuery({ queryKey: ['master', 'locations'], queryFn: () => masterDataApi.raw('locations') });
  const jobRolesQuery = useQuery({ queryKey: ['master', 'job-roles'], queryFn: () => masterDataApi.raw('job-roles') });
  const skillsQuery = useQuery({ queryKey: ['master', 'skills'], queryFn: () => masterDataApi.raw('skills') });
  const qualificationsQuery = useQuery({ queryKey: ['master', 'qualifications'], queryFn: () => masterDataApi.raw('qualifications') });
  const languagesQuery = useQuery({ queryKey: ['master', 'languages'], queryFn: () => masterDataApi.raw('languages') });
  const benefitsQuery = useQuery({ queryKey: ['master', 'benefits'], queryFn: () => masterDataApi.raw('benefits') });
  const assetsQuery = useQuery({ queryKey: ['master', 'assets'], queryFn: () => masterDataApi.raw('assets') });

  const industries: MasterRawItem[] = industriesQuery.data ?? EMPTY_ARRAY;
  const functions: MasterRawItem[] = functionsQuery.data ?? EMPTY_ARRAY;
  const locations: MasterRawItem[] = locationsQuery.data ?? EMPTY_ARRAY;
  const jobRoles: MasterRawItem[] = jobRolesQuery.data ?? EMPTY_ARRAY;
  const skills: MasterRawItem[] = Array.isArray(skillsQuery.data) ? skillsQuery.data : EMPTY_ARRAY;
  const languages: MasterRawItem[] = Array.isArray(languagesQuery.data) ? languagesQuery.data : EMPTY_ARRAY;
  const rawQuals = qualificationsQuery.data;
  const qualifications: MasterRawItem[] = useMemo(() => {
    return Array.isArray(rawQuals)
      ? rawQuals
      : rawQuals && typeof rawQuals === 'object'
        ? Object.values(rawQuals).flat()
        : EMPTY_ARRAY;
  }, [rawQuals]);

  const rawBenefitsData = benefitsQuery.data;
  const benefitsOptionsList: string[] = useMemo(() => {
    if (Array.isArray(rawBenefitsData) && rawBenefitsData.length > 0) {
      const names = rawBenefitsData.map((b: any) => (typeof b === 'string' ? b : b.name || b.title || String(b.id))).filter(Boolean);
      return Array.from(new Set([...names, ...BENEFITS_OPTIONS]));
    }
    return BENEFITS_OPTIONS;
  }, [rawBenefitsData]);

  const rawAssetsData = assetsQuery.data;
  const assetsOptionsList: string[] = useMemo(() => {
    if (Array.isArray(rawAssetsData) && rawAssetsData.length > 0) {
      const names = rawAssetsData.map((a: any) => (typeof a === 'string' ? a : a.name || a.title || String(a.id))).filter(Boolean);
      return Array.from(new Set([...names, ...ASSETS_OPTIONS]));
    }
    return ASSETS_OPTIONS;
  }, [rawAssetsData]);

  const jobRoleOptions = useMemo(() => toOptions(jobRoles), [jobRoles]);
  const industryOptions = useMemo(() => toOptions(industries), [industries]);
  const functionOptions = useMemo(() => toOptions(functions), [functions]);
  const skillOptions = useMemo(() => toOptions(skills), [skills]);
  const languageOptions = useMemo(() => toOptions(languages), [languages]);
  const benefitOptions = useMemo(() => stringOptions(benefitsOptionsList), [benefitsOptionsList]);
  const assetOptions = useMemo(() => stringOptions(assetsOptionsList), [assetsOptionsList]);
  const qualOptions = useMemo(
    () =>
      toOptions(
        qualifications.filter((q: any) => {
          if (selectedQualLevel === 'ALL') return true;
          return String(q.level || '').toUpperCase() === selectedQualLevel.toUpperCase();
        })
      ),
    [qualifications, selectedQualLevel]
  );

  const editJobQuery = useQuery({
    queryKey: ['recruiter-job-edit', editJobId],
    queryFn: () => jobsApi.get(editJobId!),
    enabled: !!editJobId,
  });
  const existingJob = editJobQuery.data;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      jobRoleName: '',
      functionId: '',
      functionName: '',
      industryIds: [],
      functionIds: [],
      workingStatus: 'IMMEDIATE_JOINER',
      wageMin: 0,
      wageMax: 0,
      skillIds: [],
      qualificationIds: [],
      languageIds: [],
      benefitNames: [],
      assetNames: [],
      wageType: 'monthly',
      workingDays: 5,
      gender: 'ANY',
      freshersOnly: false,
      headcountRequired: 1,
      minExperienceYears: 0,
      minExperienceMonths: 0,
      maxExperienceYears: undefined,
      maxExperienceMonths: undefined,
      shiftType: 'day',
      jobType: 'full-time',
      responsibilities: '',
      requirements: '',
      benefits: '',
    },
  });

  const formData = watch();
  const selectedSkillIds = formData.skillIds || [];
  const selectedQualificationIds = formData.qualificationIds || [];
  const selectedLanguageIds = formData.languageIds || [];
  const selectedIndustryIds = formData.industryIds || [];
  const selectedFunctionIds = formData.functionIds || [];

  useEffect(() => {
    if (existingJob) {
      const job: any = existingJob;
      const roleName = job.jobRoleName || job.title || job.jobRole?.name || '';
      setValue('jobRoleName', roleName);
      setJobRoleSearch(roleName);
      if (job.jobRoleId) setValue('jobRoleId', String(job.jobRoleId));

      const indIds: string[] =
        Array.isArray(job.industryIds) && job.industryIds.length > 0
          ? job.industryIds.map(String)
          : job.industryId
            ? [String(job.industryId)]
            : [];
      setValue('industryIds', indIds);
      setValue('industryId', indIds[0] ?? '');

      const fnIds: string[] =
        Array.isArray(job.functionIds) && job.functionIds.length > 0
          ? job.functionIds.map(String)
          : job.functionId
            ? [String(job.functionId)]
            : [];
      setValue('functionIds', fnIds);
      setValue('functionId', fnIds[0] ?? '');

      if (job.locationId) {
        setValue('locationId', String(job.locationId));
        const loc: any = locations.find((l: any) => String(l.id) === String(job.locationId));
        if (loc) {
          if (loc.state) {
            setSelectedState(loc.state);
            setStateInput(loc.state);
          }
          if (loc.city) {
            setSelectedCity(loc.city);
            setCityInput(loc.city);
          }
          if (loc.locality) {
            setSelectedLocalityId(String(loc.id));
            setLocalityInput(loc.locality);
          }
        }
      }

      setValue('description', job.description || '');
      const respStr = Array.isArray(job.responsibilities)
        ? job.responsibilities.join('\n')
        : String(job.responsibilities || '');
      setValue('responsibilities', respStr);

      const reqStr = Array.isArray(job.requirements)
        ? job.requirements.join('\n')
        : String(job.requirements || '');
      setValue('requirements', reqStr);

      const hlStr = Array.isArray(job.highlights)
        ? job.highlights.join('\n')
        : String(job.highlights || '');
      setValue('highlights', hlStr);

      const openings = job.openings || job.headcountRequired || 1;
      setValue('headcountRequired', Number(openings));

      const gender = job.genderPreference || job.gender || 'ANY';
      setValue('gender', gender as any);

      const isFresher = Boolean(job.freshersOnly || job.isFresherFriendly);
      setValue('freshersOnly', isFresher);

      const expMinM: number =
        job.minExperienceMonths !== undefined && job.minExperienceMonths !== null
          ? Number(job.minExperienceMonths)
          : job.experienceMin !== undefined
            ? Number(job.experienceMin) * 12
            : 0;
      const expMaxM: number | undefined =
        job.maxExperienceMonths !== undefined && job.maxExperienceMonths !== null
          ? Number(job.maxExperienceMonths)
          : undefined;

      setValue('minExperienceYears', Math.floor(expMinM / 12));
      setValue('minExperienceMonths', expMinM % 12);
      if (expMaxM !== undefined) {
        setValue('maxExperienceYears', Math.floor(expMaxM / 12));
        setValue('maxExperienceMonths', expMaxM % 12);
      }

      const wMin = job.wageMin || job.salaryMin || job.monthlyWageMin || job.dailyWageMin || job.yearlyWageMin || 0;
      const wMax = job.wageMax || job.salaryMax || job.monthlyWageMax || job.dailyWageMax || job.yearlyWageMax || wMin;
      const wType = job.wageType || job.wagePeriod || 'monthly';

      setValue('wageMin', Number(wMin));
      setValue('wageMax', Number(wMax));
      setValue('wageType', wType as any);

      if (job.workingStatus) setValue('workingStatus', job.workingStatus);

      const rawWorkingDays = job.workingDays;
      if (rawWorkingDays) {
        if (String(rawWorkingDays).includes('6') || String(rawWorkingDays).toUpperCase().includes('SIX')) {
          setValue('workingDays', 6);
        } else {
          setValue('workingDays', 5);
        }
      }

      const shiftVal = job.shift || job.shiftType || 'day';
      setValue('shiftType', String(shiftVal).toLowerCase() as any);

      const rawJobType = String(job.jobType || 'full-time').toLowerCase();
      const formattedJobType = rawJobType.includes('part') ? 'part-time' : rawJobType.includes('contract') ? 'contract' : 'full-time';
      setValue('jobType', formattedJobType as any);

      // Names coming from the API are mapped back to master-data ids; unknown names stay as custom entries.
      const mapNamesToValues = (names: any[], master: MasterRawItem[], allowCustom: boolean) =>
        names
          .map((entry: any) => {
            if (entry && typeof entry === 'object') return String(entry.id);
            const text = String(entry);
            const found: any = master.find((m: any) => m.name === text || String(m.id) === text);
            if (found) return String(found.id);
            return allowCustom ? `${NEW_PREFIX}${text}` : '';
          })
          .filter(Boolean);

      if (Array.isArray(job.skills)) setValue('skillIds', mapNamesToValues(job.skills, skills, true));
      if (Array.isArray(job.qualifications)) setValue('qualificationIds', mapNamesToValues(job.qualifications, qualifications, false));

      if (Array.isArray(job.languageIds)) {
        setValue('languageIds', job.languageIds.map(String));
      } else if (Array.isArray(job.languages)) {
        setValue('languageIds', mapNamesToValues(job.languages, languages, true));
      }

      const bNames = job.benefitNames || job.benefits || [];
      if (Array.isArray(bNames)) {
        setValue('benefitNames', bNames.map((b: any) => (typeof b === 'string' ? b : b?.name)).filter(Boolean));
      }

      const aNames = job.assetNames || job.assets || [];
      if (Array.isArray(aNames)) {
        setValue('assetNames', aNames.map((a: any) => (typeof a === 'string' ? a : a?.name)).filter(Boolean));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingJob, locations, skills, qualifications, languages, setValue]);

  const publishMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const industry = splitIdsAndNames(data.industryIds);
      const fn = splitIdsAndNames(data.functionIds);
      const skill = splitIdsAndNames(data.skillIds);
      const qual = splitIdsAndNames(data.qualificationIds);
      const lang = splitIdsAndNames(data.languageIds);

      const languageNames = (data.languageIds || [])
        .map((value) => {
          if (value.startsWith(NEW_PREFIX)) return stripNew(value).trim();
          const found: any = languages.find((l: any) => String(l.id) === value);
          return found?.name || '';
        })
        .filter(Boolean);

      const minMonths = (data.minExperienceYears ?? 0) * 12 + (data.minExperienceMonths ?? 0);
      const hasMax = data.maxExperienceYears !== undefined || data.maxExperienceMonths !== undefined;
      const maxMonths = hasMax ? (data.maxExperienceYears ?? 0) * 12 + (data.maxExperienceMonths ?? 0) : null;

      const payload = {
        jobRoleName: data.jobRoleName.trim(),
        description: data.description,
        industryId: industry.ids[0],
        industryIds: industry.ids.length > 0 ? industry.ids : undefined,
        industryNames: industry.names.length > 0 ? industry.names : undefined,
        functionId: fn.ids[0],
        functionIds: fn.ids.length > 0 ? fn.ids : undefined,
        functionNames: fn.names.length > 0 ? fn.names : undefined,
        locationId: Number(data.locationId),
        jobRoleId: data.jobRoleId ? Number(data.jobRoleId) : undefined,
        skillIds: skill.ids.length > 0 ? skill.ids : undefined,
        skillNames: skill.names.length > 0 ? skill.names : undefined,
        qualificationIds: qual.ids.length > 0 ? qual.ids : undefined,
        languageIds: lang.ids.length > 0 ? lang.ids : undefined,
        languages: languageNames,
        wageMin: data.wageMin,
        wageMax: data.wageMax,
        wageType: data.wageType,
        workingDays: data.workingDays,
        workingStatus: data.workingStatus || undefined,
        gender: data.gender,
        freshersOnly: data.freshersOnly,
        shiftType: data.shiftType,
        jobType: data.jobType,
        headcountRequired: data.headcountRequired,
        minExperienceMonths: data.freshersOnly ? undefined : minMonths,
        maxExperienceMonths: data.freshersOnly ? undefined : maxMonths,
        benefitNames: data.benefitNames,
        assetNames: data.assetNames,
        responsibilities: splitLines(data.responsibilities),
        requirements: splitLines(data.requirements),
        highlights: data.highlights ? splitLines(data.highlights) : (data.benefitNames && data.benefitNames.length > 0 ? data.benefitNames : undefined),
        benefits: splitLines(data.benefits),
      };

      if (isEditing && editJobId) {
        return jobsApi.update(editJobId, payload);
      } else {
        const job = await jobsApi.create(payload);
        return jobsApi.updateStatus(job.id, 'published');
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Job updated successfully' : 'Job published successfully');
      router.push('/recruiter/jobs');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, isEditing ? 'Failed to update job' : 'Failed to publish job')),
  });

  const setIdList = (field: 'skillIds' | 'qualificationIds' | 'languageIds', next: string[]) => {
    setValue(field, next, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
  };

  const setIndustries = (next: string[]) => {
    setValue('industryIds', next, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    setValue('industryId', next[0] ?? '', { shouldValidate: true });
  };

  const setFunctions = (next: string[]) => {
    setValue('functionIds', next, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    setValue('functionId', next[0] ?? '');
    const first = next[0];
    if (first && !first.startsWith(NEW_PREFIX)) {
      const funcObj: any = functions.find((f: any) => String(f.id) === first);
      setValue('functionName', funcObj?.name || '');
    } else {
      setValue('functionName', first ? stripNew(first) : '');
    }
  };

  const selectedLocationName = useMemo(() => {
    const loc = locations.find(l => String(l.id) === formData.locationId);
    if (!loc) return '';
    return 'city' in loc ? `${loc.city} - ${loc.locality}` : 'Selected Location';
  }, [formData.locationId, locations]);

  const labelFor = (value: string, master: MasterRawItem[]) => {
    if (value.startsWith(NEW_PREFIX)) return stripNew(value);
    const found: any = master.find((m: any) => String(m.id) === value);
    return found?.name || value;
  };

  const selectedSkillsNames = useMemo(
    () => selectedSkillIds.map((id) => labelFor(id, skills)),
    [selectedSkillIds, skills] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const selectedQualificationsNames = useMemo(
    () => selectedQualificationIds.map((id) => labelFor(id, qualifications)),
    [selectedQualificationIds, qualifications] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const previewExperience = formatExperienceRange(
    (formData.minExperienceYears ?? 0) * 12 + (formData.minExperienceMonths ?? 0),
    formData.maxExperienceYears !== undefined || formData.maxExperienceMonths !== undefined
      ? (formData.maxExperienceYears ?? 0) * 12 + (formData.maxExperienceMonths ?? 0)
      : null,
    formData.freshersOnly
  );

  const wageLabel = formData.wageType === 'daily' ? 'Per Day' : formData.wageType === 'annual' ? 'Per Annum' : 'Per Month';

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      {/* Header Row */}
      <div className="flex flex-row items-center justify-between flex-wrap gap-4 border-b border-slate-50 pb-6 text-left">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">{isEditing ? 'Edit Job Opening' : 'Create New Job'}</h1>
          <p className="text-slate-400 text-sm font-semibold mt-1">
            {isEditing ? 'Update job details, requirements, and information' : 'Fill in the details to post a new job opening instantly'}
          </p>
        </div>
      </div>

      {/* Enter moves to the next field (never submits the form); use the Publish button to submit. */}
      <form
        noValidate
        onKeyDown={handleEnterAsTab}
        onSubmit={handleSubmit(
          (data) => publishMutation.mutate(data),
          (formErrors) => {
            const firstKey = Object.keys(formErrors)[0];
            const errObj = formErrors[firstKey as keyof typeof formErrors];
            const message = errObj && 'message' in errObj && typeof errObj.message === 'string'
              ? errObj.message
              : `Please complete the required field: ${firstKey}`;
            toast.error(message);
          }
        )}
      >
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: Form Sections stacked */}
          <div className="lg:col-span-2 space-y-6">

            {/* Card 1: Basic Details */}
            <Card className={CARD}>
              <div className={SECTION_HEADER}>
                <Briefcase className="h-5 w-5" />
                <span>1. Basic Details</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Job Role Name / Title */}
                <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                  <Label className="text-slate-700 font-extrabold text-xs">Job Role / Title *</Label>
                  <SuggestInput
                    options={jobRoleOptions}
                    value={jobRoleSearch}
                    selectedLabel={formData.jobRoleId ? formData.jobRoleName : undefined}
                    placeholder="Type or select job role (e.g. Backend Developer)..."
                    onValueChange={(text) => {
                      setJobRoleSearch(text);
                      setValue('jobRoleId', undefined);
                      setValue('jobRoleName', text, { shouldValidate: true });
                    }}
                    onSelect={(option) => {
                      setValue('jobRoleId', option.value);
                      setValue('jobRoleName', option.label, { shouldValidate: true });
                      setJobRoleSearch(option.label);
                    }}
                    onCustom={(text) => {
                      const clean = text.trim();
                      setValue('jobRoleId', undefined);
                      setValue('jobRoleName', clean, { shouldValidate: true });
                      setJobRoleSearch(clean);
                    }}
                  />
                  {errors.jobRoleName && <p className="text-xs text-red-500 font-bold">{errors.jobRoleName.message}</p>}
                </div>

                {/* Headcount */}
                <div className="space-y-2">
                  <Label htmlFor="headcountRequired" className="text-slate-700 font-extrabold text-xs">Headcount *</Label>
                  <Input id="headcountRequired" type="number" min={1} {...register('headcountRequired')} className="rounded-xl border-slate-200" />
                  {errors.headcountRequired && <p className="text-xs text-red-500 font-bold">{errors.headcountRequired.message}</p>}
                </div>

                {/* Function / Department multi-select */}
                <div className="space-y-2">
                  <Label className="text-slate-700 font-extrabold text-xs">Department / Function</Label>
                  <MultiSelectCombobox
                    options={functionOptions}
                    value={selectedFunctionIds}
                    onChange={setFunctions}
                    placeholder="Type or search department/function..."
                    accent="indigo"
                    loading={functionsQuery.isLoading}
                  />
                </div>

                {/* Working Days */}
                <div className="space-y-2">
                  <Label className="text-slate-700 font-extrabold text-xs">Working Days *</Label>
                  <Select value={String(formData.workingDays ?? 5)} onValueChange={(val) => setValue('workingDays', Number(val), { shouldValidate: true })}>
                    <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 days working</SelectItem>
                      <SelectItem value="6">6 days working</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <Label className="text-slate-700 font-extrabold text-xs">Gender Requirement *</Label>
                  <Select value={formData.gender || 'ANY'} onValueChange={(val: 'ANY' | 'MALE' | 'FEMALE') => setValue('gender', val, { shouldValidate: true })}>
                    <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ANY">Any</SelectItem>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Working Status */}
                <div className="space-y-2">
                  <Label className="text-slate-700 font-extrabold text-xs">Working Status</Label>
                  <Select value={formData.workingStatus || 'IMMEDIATE_JOINER'} onValueChange={(val) => setValue('workingStatus', val, { shouldValidate: true })}>
                    <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IMMEDIATE_JOINER">Immediate Joiner</SelectItem>
                      <SelectItem value="SERVING_NOTICE">Serving Notice</SelectItem>
                      <SelectItem value="ANY">Any Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Required Experience (years + months) */}
              <div className="space-y-3 border-t border-slate-50 pt-3">
                <Label className="text-slate-700 font-extrabold text-xs">Experience Requirement *</Label>

                <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Checkbox
                    id="freshersOnly"
                    checked={formData.freshersOnly}
                    onCheckedChange={(checked) => {
                      const isChecked = Boolean(checked);
                      setValue('freshersOnly', isChecked, { shouldValidate: true });
                      if (isChecked) {
                        setValue('minExperienceYears', 0);
                        setValue('minExperienceMonths', 0);
                        setValue('maxExperienceYears', undefined);
                        setValue('maxExperienceMonths', undefined);
                      }
                    }}
                  />
                  <label htmlFor="freshersOnly" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Only freshers should apply
                  </label>
                </div>

                {!formData.freshersOnly && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-slate-500 font-bold text-xs">Minimum Experience</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <Input id="minExperienceYears" type="number" min={0} max={60} inputMode="numeric" aria-label="Minimum experience years" {...register('minExperienceYears')} className="rounded-xl border-slate-200 pr-12" />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">yrs</span>
                        </div>
                        <div className="relative">
                          <Input id="minExperienceMonths" type="number" min={0} max={11} inputMode="numeric" aria-label="Minimum experience months" {...register('minExperienceMonths')} className="rounded-xl border-slate-200 pr-12" />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">mo</span>
                        </div>
                      </div>
                      {(errors.minExperienceYears || errors.minExperienceMonths) && (
                        <p className="text-xs text-red-500 font-bold">{errors.minExperienceYears?.message || errors.minExperienceMonths?.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-500 font-bold text-xs">Maximum Experience (optional)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <Input id="maxExperienceYears" type="number" min={0} max={60} inputMode="numeric" placeholder="e.g. 5" aria-label="Maximum experience years" {...register('maxExperienceYears')} className="rounded-xl border-slate-200 pr-12" />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">yrs</span>
                        </div>
                        <div className="relative">
                          <Input id="maxExperienceMonths" type="number" min={0} max={11} inputMode="numeric" placeholder="e.g. 6" aria-label="Maximum experience months" {...register('maxExperienceMonths')} className="rounded-xl border-slate-200 pr-12" />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">mo</span>
                        </div>
                      </div>
                      {(errors.maxExperienceYears || errors.maxExperienceMonths) && (
                        <p className="text-xs text-red-500 font-bold">{errors.maxExperienceYears?.message || errors.maxExperienceMonths?.message}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Card 2: Location & Industry */}
            <Card className={CARD}>
              <div className={SECTION_HEADER}>
                <MapPin className="h-5 w-5" />
                <span>2. Location & Industry</span>
              </div>
              <div className="space-y-4">
                {/* Industry multi-select */}
                <div className="space-y-2 max-w-md">
                  <Label className="text-slate-700 font-extrabold text-xs">Industry *</Label>
                  <MultiSelectCombobox
                    options={industryOptions}
                    value={selectedIndustryIds}
                    onChange={setIndustries}
                    placeholder="Type to search industry..."
                    accent="blue"
                    loading={industriesQuery.isLoading}
                  />
                  {errors.industryIds && <p className="text-xs text-red-500 font-bold">{errors.industryIds.message}</p>}
                </div>

                <Separator className="my-2 bg-slate-50" />

                {/* Location Selection Grid */}
                <div className="space-y-2">
                  <Label className="text-slate-700 font-extrabold text-xs">Location *</Label>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {/* State */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-slate-400 font-bold uppercase">State</Label>
                      <SuggestInput
                        options={stateOptions}
                        value={stateInput}
                        selectedLabel={selectedState}
                        loading={isLoadingStates}
                        placeholder="Type or select state..."
                        onValueChange={setStateInput}
                        onSelect={(option) => handleStateChange(option.value)}
                        onCustom={(text) => handleStateChange(text.trim())}
                        onBlurCommit={() => {
                          const matched = states.find((s: string) => s.toLowerCase() === stateInput.trim().toLowerCase());
                          if (matched) handleStateChange(matched);
                          else if (selectedState) setStateInput(selectedState);
                        }}
                      />
                    </div>

                    {/* City */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-slate-400 font-bold uppercase">City</Label>
                      <SuggestInput
                        options={cityOptions}
                        value={cityInput}
                        selectedLabel={selectedCity}
                        loading={isLoadingCities}
                        disabled={!selectedState}
                        placeholder={selectedState ? 'Type or select city...' : 'Choose state first'}
                        onValueChange={setCityInput}
                        onSelect={(option) => handleCityChange(option.value)}
                        onCustom={(text) => handleCityChange(text.trim())}
                        onBlurCommit={() => {
                          const matched = cities.find((c: string) => c.toLowerCase() === cityInput.trim().toLowerCase());
                          if (matched) handleCityChange(matched);
                          else if (selectedCity) setCityInput(selectedCity);
                        }}
                      />
                    </div>

                    {/* Locality */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-slate-400 font-bold uppercase">Locality</Label>
                      <SuggestInput
                        options={localityOptions}
                        value={localityInput}
                        selectedLabel={localities.find((l: BackendLocation) => String(l.id) === selectedLocalityId)?.locality}
                        loading={isLoadingLocalities}
                        disabled={!selectedCity}
                        placeholder={selectedCity ? 'Type or select locality...' : 'Choose city first'}
                        onValueChange={setLocalityInput}
                        onSelect={(option) => handleLocalityChange(option.value)}
                        onCustom={(text) => handleCustomLocality(text.trim())}
                        onBlurCommit={() => {
                          const matched = localities.find((l: BackendLocation) => l.locality.toLowerCase() === localityInput.trim().toLowerCase());
                          if (matched) {
                            handleLocalityChange(String(matched.id));
                          } else if (selectedLocalityId) {
                            const activeLoc = localities.find((l: BackendLocation) => String(l.id) === selectedLocalityId);
                            setLocalityInput(activeLoc ? activeLoc.locality : '');
                          }
                        }}
                      />
                    </div>
                  </div>
                  {errors.locationId && <p className="text-xs text-red-500 font-bold mt-1">{errors.locationId.message}</p>}
                </div>
              </div>
            </Card>

            {/* Card 3: Skills & Qualifications */}
            <Card className={CARD}>
              <div className={SECTION_HEADER}>
                <Code className="h-5 w-5" />
                <span>3. Skills & Qualifications</span>
              </div>

              <div className="space-y-3">
                <Label className="text-slate-700 font-extrabold text-xs">Required Skills</Label>
                <MultiSelectCombobox
                  options={skillOptions}
                  value={selectedSkillIds}
                  onChange={(next) => setIdList('skillIds', next)}
                  placeholder="Type to search and select skills..."
                  showSearchIcon
                  loading={skillsQuery.isLoading}
                />
              </div>

              <Separator className="my-2 bg-slate-50" />

              <div className="space-y-3">
                <Label className="text-slate-700 font-extrabold text-xs">Qualifications Required</Label>

                {/* Candidate-side Qualification Level Filter Buttons */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-slate-400 font-bold uppercase block">Filter by Level</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {['ALL', ...QUAL_CATEGORY_ORDER].map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedQualLevel(key)}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-xs font-bold transition-all border',
                          selectedQualLevel === key
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        )}
                      >
                        {key === 'ALL' ? 'All Levels' : QUAL_CATEGORY_LABELS[key] || key}
                      </button>
                    ))}
                  </div>
                </div>

                <MultiSelectCombobox
                  options={qualOptions}
                  value={selectedQualificationIds}
                  onChange={(next) => setIdList('qualificationIds', next)}
                  placeholder={`Search ${selectedQualLevel !== 'ALL' ? QUAL_CATEGORY_LABELS[selectedQualLevel] || selectedQualLevel : 'qualifications'}...`}
                  showSearchIcon
                  allowCustom={false}
                  requireQuery={selectedQualLevel === 'ALL'}
                  loading={qualificationsQuery.isLoading}
                />
              </div>

              <Separator className="my-2 bg-slate-50" />

              <div className="space-y-3">
                <Label className="text-slate-700 font-extrabold text-xs">Required Languages</Label>
                <MultiSelectCombobox
                  options={languageOptions}
                  value={selectedLanguageIds}
                  onChange={(next) => setIdList('languageIds', next)}
                  placeholder="Search and add required languages (English, Hindi, Tamil, etc.)..."
                  showSearchIcon
                  loading={languagesQuery.isLoading}
                />
              </div>
            </Card>

            {/* Card 4: Salary & Shift */}
            <Card className={CARD}>
              <div className={SECTION_HEADER}>
                <IndianRupee className="h-5 w-5" />
                <span>4. Salary, Shifts & Types</span>
              </div>

              <div className="space-y-2 max-w-xs">
                <Label className="text-slate-700 font-extrabold text-xs">Salary Type *</Label>
                <Select value={formData.wageType || 'monthly'} onValueChange={(val: 'monthly' | 'annual' | 'daily') => setValue('wageType', val, { shouldValidate: true })}>
                  <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Per Month Salary (₹)</SelectItem>
                    <SelectItem value="annual">Per Annum Salary (₹)</SelectItem>
                    <SelectItem value="daily">Per Day Salary (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="wageMin" className="text-slate-700 font-extrabold text-xs">
                    Minimum Wage (₹) ({wageLabel}) *
                  </Label>
                  <Input id="wageMin" type="number" placeholder="25000" {...register('wageMin')} className="rounded-xl border-slate-200" />
                  {errors.wageMin && <p className="text-xs text-red-500 font-bold">{errors.wageMin.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wageMax" className="text-slate-700 font-extrabold text-xs">
                    Maximum Wage (₹) ({wageLabel}) *
                  </Label>
                  <Input id="wageMax" type="number" placeholder="40000" {...register('wageMax')} className="rounded-xl border-slate-200" />
                  {errors.wageMax && <p className="text-xs text-red-500 font-bold">{errors.wageMax.message}</p>}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-extrabold text-xs">Shift *</Label>
                  <Select value={formData.shiftType || 'day'} onValueChange={(value: 'day' | 'night' | 'rotational') => setValue('shiftType', value, { shouldValidate: true })}>
                    <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day Shift</SelectItem>
                      <SelectItem value="night">Night Shift</SelectItem>
                      <SelectItem value="rotational">Rotational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-extrabold text-xs">Job Type *</Label>
                  <Select value={formData.jobType || 'full-time'} onValueChange={(value: 'full-time' | 'part-time' | 'contract') => setValue('jobType', value, { shouldValidate: true })}>
                    <SelectTrigger className="rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full Time</SelectItem>
                      <SelectItem value="part-time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Card 5: Benefits */}
            <Card className={CARD}>
              <div className={SECTION_HEADER}>
                <Rocket className="h-5 w-5" />
                <span>5. Benefits Provided</span>
              </div>
              <MultiSelectCombobox
                options={benefitOptions}
                value={formData.benefitNames || []}
                onChange={(next) => setValue('benefitNames', next, { shouldDirty: true, shouldTouch: true })}
                createValue={(label) => label}
                placeholder="Type to search and select benefits..."
                showSearchIcon
              />
            </Card>

            {/* Card 6: Required Assets / Documents */}
            <Card className={CARD}>
              <div className={SECTION_HEADER}>
                <FileText className="h-5 w-5" />
                <span>6. Required Assets / Documents</span>
              </div>
              <MultiSelectCombobox
                options={assetOptions}
                value={formData.assetNames || []}
                onChange={(next) => setValue('assetNames', next, { shouldDirty: true, shouldTouch: true })}
                createValue={(label) => label}
                placeholder="Type to search and select required assets..."
                showSearchIcon
              />
            </Card>

            {/* Card 7: Job Detail Sections */}
            <Card className={CARD}>
              <div className={SECTION_HEADER}>
                <FileText className="h-5 w-5" />
                <span>7. Job Description Details</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-700 font-extrabold text-xs">General Description *</Label>
                <Textarea id="description" rows={5} placeholder="Describe the role details..." {...register('description')} className="rounded-xl border-slate-200" />
                {errors.description && <p className="text-xs text-red-500 font-bold">{errors.description.message}</p>}
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="responsibilities" className="text-slate-700 font-extrabold text-xs">Responsibilities (One per line)*</Label>
                  <Textarea id="responsibilities" rows={4} placeholder="e.g. Design, develop, and maintain RESTful APIs" {...register('responsibilities')} className="rounded-xl border-slate-200" />
                  {errors.responsibilities && <p className="text-xs text-red-500 font-bold">{errors.responsibilities.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requirements" className="text-slate-700 font-extrabold text-xs">Requirements (One per line)*</Label>
                  <Textarea id="requirements" rows={4} placeholder="e.g. 3 years Node.js experience" {...register('requirements')} className="rounded-xl border-slate-200" />
                  {errors.requirements && <p className="text-xs text-red-500 font-bold">{errors.requirements.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="highlights" className="text-slate-700 font-extrabold text-xs">Job Highlights (One per line)</Label>
                  <Textarea id="highlights" rows={4} placeholder="e.g. Fast growing startup&#10;Flexible working hours&#10;Immediate joining" {...register('highlights')} className="rounded-xl border-slate-200" />
                </div>
              </div>
            </Card>

          </div>

          {/* Right Column: Sticky Live Preview & Action panel */}
          <div className="space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">

              {/* Card A: Interactive Live Preview */}
              <Card className="p-6 border border-slate-100 rounded-2xl shadow-sm bg-white text-left space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-xs border-b border-slate-50 pb-3">
                  <Eye className="h-4 w-4" />
                  <span>Job Listing Live Preview</span>
                </div>

                <div className="space-y-3.5 pt-1">
                  <span className="bg-indigo-50 text-indigo-600 border-none font-bold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                    {formData.jobType}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-800 leading-tight">
                    {formData.jobRoleName || 'Job Role / Title'}
                  </h3>

                  <div className="space-y-2 text-xs text-slate-500 font-semibold border-t border-b border-slate-50 py-3.5">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>{selectedLocationName || 'Location not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="capitalize">{formData.shiftType} Shift</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>{previewExperience}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>{formData.headcountRequired || 1} openings available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-4 flex items-center justify-center text-[10px] font-bold bg-slate-100 rounded text-slate-500 shrink-0">₹</span>
                      <span>Salary: {formatWage(Number(formData.wageMin) || 0, Number(formData.wageMax) || 0, formData.wageType)}</span>
                    </div>
                  </div>

                  {/* Summary / Description preview */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role Overview</span>
                    <p className="text-xs text-slate-600 leading-relaxed truncate-3-lines mt-1">
                      {formData.description || 'Description details will appear here as you type...'}
                    </p>
                  </div>

                  {/* Skills/Qualifications previews */}
                  {selectedSkillsNames.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Skills</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedSkillsNames.map((name: string) => (
                          <Badge key={name} variant="secondary" className="bg-slate-100/80 hover:bg-slate-100 text-slate-600 border-none font-bold text-xs px-2.5 py-1 rounded-lg shadow-sm">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedQualificationsNames.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Qualifications</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedQualificationsNames.map((name: string) => (
                          <Badge key={name} variant="outline" className="border-slate-150 text-slate-500 font-bold text-xs px-2.5 py-1 rounded-lg shadow-sm">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Card B: Action Panel */}
              <Card className="p-5 border border-slate-100 rounded-2xl shadow-sm bg-white text-left space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submit Actions</span>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Make sure you have completed the details. Once published, your listing goes live instantly on SCN Jobs.</p>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={publishMutation.isPending}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl py-3 text-xs shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all h-auto flex items-center justify-center gap-1.5"
                  >
                    <Rocket className="h-4 w-4" />
                    {publishMutation.isPending ? (isEditing ? 'Updating...' : 'Publishing...') : (isEditing ? 'Update Job' : 'Publish Job')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/recruiter/jobs')}
                    className="w-full border-slate-200 hover:bg-slate-50 hover:text-slate-700 text-slate-500 font-bold rounded-xl py-3 text-xs h-auto shadow-sm"
                  >
                    Cancel / Discard
                  </Button>
                </div>
              </Card>

            </div>
          </div>
        </div>
      </form>
    </div>
  );
}